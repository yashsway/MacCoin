var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var db = new Loki('loki.json');

var wallet = db.addCollection('wallet');
var transaction = db.addCollection('transaction');
var transactionCount = transaction.count();

app.use(express.static(__dirname + '/bower_components'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(4200); 

io.on('connection', function(client) {  
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
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

var delay = 500;
window.setInterval(distributeCoins(), delay);

function distributeCoins() {
    // TODO: update database
}

function createWallet() {
    wallet.insert({
        // Need to generate the ids and keys
        wallet_id: "abc123",
        wallet_key: "abc123",
        balance: 0,
        created: new Date()
    });
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

