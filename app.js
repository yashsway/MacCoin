var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var Loki = require('lokijs');
var db = new Loki('loki.json');
var path = require('path');
require('dotenv').config();

var wallet = db.addCollection('wallet');
var transaction = db.addCollection('transaction');
var transactionCount = transaction.count();

// Serve frontend/public
app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

var port = process.env.PORT || 80;
server.listen(port, () => {
    console.log("Listening on port: " + port);
}); 

io.on('connection', function(client) {  
    console.log('Connection made...');

    client.on('requestWallet', function(callback) {
        console.log("Wallet requested");
        var wallet = createWallet();
        client['wallet_id'] = wallet['wallet_id'];
        console.log("Created wallet: " + wallet['wallet_id']);
        callback(wallet);
    });

    client.on('haveWallet', function(id) {
        client['wallet_id'] = id;
        console.log("Existing wallet: "+client['wallet_id']);
    });

    client.on('send', function(amount, from_wallet_key, from_wallet_id, to_wallet_id) {
        var senderWallet = wallet.by("name", from_wallet_id);
        if ((senderWallet.balance >= amount) && (senderWallet.wallet_key == from_wallet_key)) {
            createTransaction(amount, from_wallet_id, to_wallet_id);
            // update view
        } else {
            // error? idk
        }
    });

    // client.emit('updateBalance', /* user's balance */); 
});

var delay = 1000;
setInterval(distributeCoins, delay);

function distributeCoins() {
    // TODO: update database
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
    while (wallet.find({wallet_id: id}).length > 0) {
        console.log("Wallet ID not unique, trying again...")
        id = makeid();
    }
    wallet.insert({
        // Need to generate the ids and keys
        wallet_id: id,
        wallet_key: key,
        balance: 0,
        created: new Date()
    });
    return {wallet_id: id, wallet_key: key};
}

function createTransaction(amount, from_wallet_id, to_wallet_id,) {
    transaction.insert({
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

