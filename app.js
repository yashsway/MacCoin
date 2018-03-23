var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var Loki = require('lokijs');
var path = require('path');
var firebase = require('firebase');
require('dotenv').config();

var config = {
    apiKey: "AIzaSyDqWPmiV-xBZFF5dstqsWh6rdVbjaNWKOE",
    authDomain: "maccoin-697ec.firebaseapp.com",
    databaseURL: "https://maccoin-697ec.firebaseio.com",
    projectId: "maccoin-697ec",
    storageBucket: "",
    messagingSenderId: "1073396667730"
};
var firebaseApp = firebase.initializeApp(config);
var firebaseDB = firebaseApp.database();

var CONFIG_BLOCK_TIME = 5000;
var CONFIG_BLOCK_AMOUNT = 10000;

var wallets, transactions, blocks;
var db = new Loki('database.json', {
    autoload: true,
    autoloadCallback: () => {
        wallets = db.getCollection('wallets');
        if(wallets === null) {
            wallets = db.addCollection('wallets');
        }

        transactions = db.getCollection('transactions');
        if(transactions === null) {
            transactions = db.addCollection('transactions');
        }

        blocks = db.getCollection('blocks');
        if(blocks === null) {
            blocks = db.addCollection('blocks');
        }
    },
    autosave: true,
    autosaveInterval: 3500,
});

// Serve frontend/public
app.use(express.static(path.join(__dirname, 'frontend/build')));
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Start Server
var port = process.env.PORT || 80;
server.listen(port, () => {
    console.log("Listening on port: " + port);
});


// This is an array of all clients that are currently connected and active
var activeMiners = [];

// This is a map from wallet id to clients
// Key: wallet_id
// Value: [client] (array of clients)
var clientsForWallet = {};


/*
    Telemetry
*/
var TELEMETRY_INTERVAL = 60000; // 1min
var connectedClientsCount = 0;
setInterval(() => {
    firebaseDB.ref('telemetry/' + new Date().toString()).push({
        "active_miners": activeMiners.length,
    });
}, TELEMETRY_INTERVAL);

/*
    Socket.io stuff
*/

io.on('connection', function(client) {
    connectedClientsCount++;

    client.on('requestWallet', function(callback) {
        console.log("Wallet requested");
        var wallet = createWallet();
        callback(wallet);
    });

    client.on('haveWallet', function(walletInfo) {
        var walletId = walletInfo['wallet_id'];
        var walletKey = walletInfo['wallet_key'];

        // If we didn't get the right params, reject the client connection
        if(!walletId || !walletKey) {
            console.log("Expected wallet_id and wallet_key");
            client.disconnect();
            return;
        }

        // Save the info to the client
        client['wallet_id'] = walletId;
        client['wallet_key'] = walletKey;

        // Just in case, let's make sure the client key matches up
        var existingWallet = wallets.findObject({ wallet_id: walletId});
        if(!existingWallet) {
            // We didn't find any wallet even though the client clearly has gotten stuff
            // let's err on the side of caution and create it anyway
            console.log("Client thinks it has an existing wallet but we couldn't find it - creating it");
            console.log("ID: " + walletId + ", Key: " + walletKey);
            wallets.insert({
                // Need to generate the ids and keys
                wallet_id: walletId,
                wallet_key: walletKey,
                balance: 0,
                created: new Date()
            });
        } else {
            // Sanity check that the key is the same
            if (existingWallet.wallet_key !== walletKey) {
                console.log("This shouldn't happen - existing wallet exists with mismatching key");
                console.log("Expected: " + existingWallet.wallet_key);
                console.log("Got: " + walletKey);
                console.log(existingWallet);
                client.disconnect(); // Don't fuck us up anymore
            }
        }

        // Give them their list of transactions
        client.emit('updateTransactions', getTransactionsForWallet(client.wallet_id));

        // Give them their current balance
        var walletObject = wallets.findObject({ wallet_id: client.wallet_id });
        client.emit('updateBalance', walletObject.balance);

        // Add client to our global list
        if(!clientsForWallet[walletId]) {
            clientsForWallet[walletId] = [];
        }

        clientsForWallet[walletId].push(client);

        console.log("Wallet joined: " + walletId);
    });

    client.on('send', function(transaction, callback) {
        var from_wallet_id = transaction.from_wallet_id;
        var from_wallet_key = transaction.from_wallet_key;
        var to_wallet_id = transaction.to_wallet_id;

        var senderWallet = wallets.getObject("wallet_id", from_wallet_id);
        var allClients = io.sockets.clients();

        if ((senderWallet.balance >= amount) && (senderWallet.wallet_key == from_wallet_key)) {
            var newBalances = createTransaction(amount, from_wallet_id, to_wallet_id);
            
            // Let both the from and to clients know that the transaction happened (if they're connected)
            clientsForWallet[to_wallet_id].map((c) => {
                c.emit('updateTransactions', getTransactionsForWallet(to_wallet_id));
            });

            clientsForWallet[from_wallet_id].map((c) => {
                c.emit('updateTransactions', getTransactionsForWallet(from_wallet_id));
            });
        } else {
            console.log("User tried to send more than they had - cancelling");
        }
    });

    client.on('startMining', function() {
        // Prevent race condition
        if (!client.active && client.wallet_id) {
            console.log(client.wallet_id + " started mining");
            activeMiners.push(client);
            client.active = true;
        }
    });

    client.on('stopMining', function() {
        console.log(client.wallet_id + " stopped mining");
        client.active = false;

        // Remove from activeMiners
        var index = activeMiners.indexOf(client);
        if (index > -1) {
            activeMiners.splice(index, 1);
        } else {
            console.log("Unexpected: Client stopped mining before they started!");
        }
    });

    client.on('disconnect', function() {
        connectedClientsCount--;
        console.log("Wallet disconnected: " + client.wallet_id)

        // Remove from active miners (if it exists)
        var index = activeMiners.indexOf(client);
        if (index > -1) {
            activeMiners.splice(index, 1);
        }

        // Remove from the list of clients for the wallet
        clientsForWallet[client.wallet_id].splice(clientsForWallet[client.wallet_id].indexOf(client), 1);
    });
});

setInterval(distributeCoins, CONFIG_BLOCK_TIME);

function distributeCoins() {
    // First, calculate how many legit miners we have
    // technically it shouldn't be possible to multi-mine, but we're going to check anyway
    var uniqueClients = [];
    for (var i = 0; i < activeMiners.length; i++) {
        var walletId = activeMiners[i].wallet_id;
        if(!uniqueClients.includes(walletId)) {
            uniqueClients.push(walletId);
        }
    }

    var minerCount = uniqueClients.length;
    var amountEach = CONFIG_BLOCK_AMOUNT / minerCount;
    var paidClients = [];

    // Keep track of who has already gotten paid
    for(var i = 0; i < activeMiners.length; i++) {
        var walletId = activeMiners[i].wallet_id;
        var result = wallets.findObject({wallet_id: walletId});
        if(result && !paidClients.includes(walletId)) {
            result.balance += amountEach;
            wallets.update(result);
            paidClients.push(walletId);
        }

        // Update every client with that wallet id
        for(var j = 0; j < clientsForWallet[walletId].length; j++) {
            clientsForWallet[walletId][j].emit('updateBalance', result.balance)
        }
    }

    console.log("Distributed " + CONFIG_BLOCK_AMOUNT + " MacCoin to " + minerCount + " miners (" + amountEach + " each) >> " + paidClients);

}

function makeid() {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }

function createWallet() {
    var key = makeid();
    var id = makeid();
    // If duplicate, try again
    while (wallets.find({wallet_id: id}).length > 0) {
        console.log("Wallet ID not unique, trying again...")
        id = makeid();
    }
    wallets.insert({
        // Need to generate the ids and keys
        wallet_id: id,
        wallet_key: key,
        balance: 0,
        created: new Date()
    });
    console.log("Created wallet: " + id);
    return {wallet_id: id, wallet_key: key};
}

function createTransaction(amount, from_wallet_id, to_wallet_id,) {
    transactions.insert({
        transaction_id: transactionCount++,
        from_wallet_id: from_wallet_id,
        to_wallet_id: to_wallet_id,
        amount: amount,
        time: new Date()
    });

    var fromWallet = wallets.getObject("wallet_id", from_wallet_id);
    fromWallet.balance = fromWallet.balance - amount;
    
    var toWallet = wallets.getObject("wallet_id", to_wallet_id);
    toWallet.balance = toWallet.balance + amount;

    return {"fromBalance": fromWallet.balance, "toWallet": toWallet.balance};
}

function getTransactionsForWallet(walletId) {
    return transactions.find({
        '$or': [
            {
                'to_wallet_id': walletId
            },
            {
                'from_wallet_id': walletId
            }
        ]
    });
}
