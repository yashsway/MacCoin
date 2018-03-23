var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var Loki = require('lokijs');
var path = require('path');
require('dotenv').config();

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
    autosaveInterval: 4000,
});

// Serve frontend/public
app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

var port = process.env.PORT || 80;
server.listen(port, () => {
    console.log("Listening on port: " + port);
});


// This is an array of all clients that are currently connected and active
var activeMiners = [];

io.on('connection', function(client) {
    client.on('requestWallet', function(callback) {
        console.log("Wallet requested");
        var wallet = createWallet();
        callback(wallet);
    });

    client.on('haveWallet', function(walletInfo) {
        var walletId = walletInfo['wallet_id'];
        var walletKey = walletInfo['wallet_key'];
        if(!walletId || !walletKey) {
            console.log("Expected wallet_id and wallet_key");
            client.disconnect();
            return;
        }

        // Save the info to the client
        client['wallet_id'] = walletId;

        // Just in case
        var existingWallet = wallets.findObject({ wallet_id: walletId});
        if(!existingWallet) {
            console.log("Client thinks it has an existing wallet but we couldn't find it - creating it");
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
                client.disconnect(); // Don't fuck us up anymore
            }
        }

        // Add them to the list of miners automatically
        if(!client.raceCheck) {
            client.active = true;
            activeMiners.push(client);
        }

        console.log("Wallet joined: " + walletId);
    });

    client.on('send', function(amount, from_wallet_key, from_wallet_id, to_wallet_id) {
        var senderWallet = wallets.by("name", from_wallet_id);
        if ((senderWallet.balance >= amount) && (senderWallet.wallet_key == from_wallet_key)) {
            createTransaction(amount, from_wallet_id, to_wallet_id);
            // update view
        } else {
            // error? idk
        }
    });

    client.on('startMining', function() {
        // Prevent race condition
        if (!client.active && client.wallet_id) {
            activeMiners.push(client);
            client.active = true;
        }
    });

    client.on('stopMining', function() {
        client.active = false;
        var index = activeMiners.indexOf(client);
        if (index > -1) {
            activeMiners.splice(index, 1);
        } else {
            // Handle race condition where they leave the page before they send the haveWallet event
            client.raceCheck = true;
        }
    });

    client.on('disconnect', function() {
        console.log("Wallet disconnected: " + client.wallet_id)
        // Yay code duplication
        var index = activeMiners.indexOf(client);
        if (index > -1) {
            activeMiners.splice(index, 1);
        }
    });

    // client.emit('updateBalance', /* user's balance */); 
});

setInterval(distributeCoins, CONFIG_BLOCK_TIME);

function distributeCoins() {
    var minerCount = activeMiners.length;
    var amountEach = CONFIG_BLOCK_AMOUNT / minerCount;

    var allWalletsString = ""; // For debugging
    for(var i = 0; i < activeMiners.length; i++) {
        var walletId = activeMiners[i].wallet_id;
        allWalletsString += walletId + ",";
        var result = wallets.findObject({wallet_id: walletId});
        if(result) {
            result.balance += amountEach;
            wallets.update(result);
        }
    }

    console.log("Distributed " + CONFIG_BLOCK_AMOUNT + " MacCoin to " + minerCount + " miners (" + amountEach + " each) >> " + allWalletsString);
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

    var fromWallet = wallet.by("wallet_id", from_wallet_id);
    fromWallet.balance = fromWallet.balance - amount;
    
    var toWallet = wallet.vby("wallet_id", to_wallet_id);
    toWallet.balance = toWallet.blaance + amount;
}

