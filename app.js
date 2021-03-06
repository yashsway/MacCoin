var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var Loki = require('lokijs');
var path = require('path');
var firebase = require('firebase');
require('dotenv').config();

// logger
var winston = require('winston');
winston.configure({
    transports: [
        new (winston.transports.File)({ filename: './db-clean.log' })
    ]
});

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
var CONFIG_HEARTBEAT_TIMEOUT = 30000;
var CONFIG_SUPPORTED_TEAMS = ["artsci","commerce","engineering","healthsci","humanities","kin","nursing","science","socsci", "none"];


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
        // initialize
        DBInitFinished();
        // clean negative trs
        clean(false);
    },
    autosave: true,
    autosaveInterval: 3500,
});
// fix errors
function clean(option = false) {
    function logger(message){
        if(option) {
            winston.log(message);
        } else {
            console.log(message);
        }
    }
    logger('--------Starting clean--------');
    // -------------- WALLETS -------------
    // skeleton fx
    function cleanWallet(whereCond = null, message = 'bad where condition', cleanerCond = (obj) => { return; }) {
        var badObjs = [];
        if(whereCond!==null) badObjs = wallets.where(whereCond);
        logger(`${message} ${badObjs.length}`);
        for (var i=0;i<badObjs.length;i++) {
            logger(`${badObjs[i].wallet_id} corrupt, balance: ${badObjs[i].balance}`);
            badObjs[i] = cleanerCond(badObjs[i]);
            logger(`new balance: ${badObjs[i].balance}`)
        }
        if ((badObjs.length>0) && (this.option!==false)) wallets.update(badObjs);
    }
    // clean NaNs or exponentials
    cleanWallet(function(obj){
        // check for NaN by attempting to parse as float
       return isNaN(parseFloat(obj.balance)) || (obj.balance.toString()).includes('e');
    },"NaN balances found:",function(obj) {
        // reset to 0
        obj.balance = 0;
        return obj;
    });
    // reset negatives in wallet
    cleanWallet(function(obj){
        return (parseFloat(obj.balance)<0);
    },"Neg balances found:",function(obj) {
        // reset to 0
        obj.balance = Math.abs(obj.balance);
        return obj;
    });
    // decimals in wallet (doesn't show up in graph!)
    cleanWallet(function(obj){
        return (parseFloat(obj.balance)%1!==0);
    },"float balances found:",function(obj) {
        // reset to 0
        obj.balance = Math.round(obj.balance);
        return obj;
    });
    // --------- TRANSACTIONS ----------
    // helper function
    function createTransaction(amount, from_wallet_id, to_wallet_id,time=new Date()) {
        transactions.insert({
            from_wallet_id: from_wallet_id,
            to_wallet_id: to_wallet_id,
            amount: amount,
            time: time
        });
    
        var fromWallet = wallets.findObject({"wallet_id": from_wallet_id});
        if(!fromWallet) return;
        fromWallet.balance = parseFloat(fromWallet.balance) - parseFloat(amount);
        
        var toWallet = wallets.findObject({"wallet_id": to_wallet_id});
        if(!toWallet) return;
        toWallet.balance = parseFloat(toWallet.balance) + parseFloat(amount);
    
        var newBalances = {"fromBalance": fromWallet.balance, "toBalance": toWallet.balance};
    
        return newBalances;
    }
    function cleanNegTrxs() {
        var errs = [];
        var fixes = 0;
        // clean negatives
        errs = transactions.find({ amount:{'$jlt': 0}});
        logger(`neg trxs found: ${errs.length}`);
        for (var i=0;i<errs.length;i++) {
            if (isNaN(errs[i].amount)) {
                transactions.remove(errs[i]);
            };
            var fixed = transactions.find({ amount: {'$eq': Math.abs(errs[i].amount)}, from_wallet_id: { '$eq': errs[i].from_wallet_id}, to_wallet_id: { '$eq': errs[i].to_wallet_id }, time: {'$eq':errs[i].time} });
            if (fixed.length===0) {
                logger(`fixing tr ${i} at ${errs[i].time} from ${errs[i].from_wallet_id} to ${errs[i].to_wallet_id}, amount: ${errs[i].amount}`);
                // make transaction reverting change in same account. (crediting coins back)
                if (option!==false) { 
                    var ret = createTransaction(Math.abs(errs[i].amount),errs[i].from_wallet_id,errs[i].to_wallet_id,errs[i].time);
                    logger(ret);
                    if (ret===undefined) winston.error('transaction not fixed.');
                    else fixes += 1;
                }
            }
        }
        logger(`neg trxs fixed: ${fixes}`);
    }
    // clean laundered wallets - recursive strat
    // account balances - check for neg trxs - follow every sent after neg - recursively repeat algo for sent to wallet
    // recalculate their balance if the negative transaction hadn't happened
    // recalculate their balance after each subsequent transaction
    // invalidate any of those transactions that shouldn't of been possible
    function cleanRecursiveInvalidWallets() {
        function checkTrxsByWallet(walletIndex = null, refWallet = null, refTrx = null) {
            if (walletIndex===null) return;
            // find wallet at given index
            var [currWallet,currWalletIndex] = wallets.get(walletIndex,true);
            if (refWallet===null) logger(`${currWallet.wallet_id} - balance: ${currWallet.balance}`);
            else logger(`tracing from ${refWallet.wallet_id} - ${currWallet.wallet_id} - balance: ${currWallet.balance}`);
            // check if bad trxs actually exist in association, if not, leave, only perform if refWallet and refTrx not set (i.e. first call)
            if (refWallet===null || refTrx===null) {
                var trxs = transactions.find({ 'from_wallet_id': { '$eq': currWallet.wallet_id },'amount': { '$lt': 0 }});
                if (trxs.length===0) return;
            }
            // potential perp found, repull with all bad trxs - assumed to be in order from oldest to newest? - after certain id if provided
            // if refTrx provided - find the trx associated to new wallet with the same amount - get everything greater than the id of this trx if it exists. 
            // if nothing exists after, send that money back to referrer. -- not doing this coin trace rn, innocent people get their balances fucked --
            //  : transactions.find({ 'from_wallet_id': { '$eq': currWallet.wallet_id }, '$loki': { '$gt': refTrx['$loki'] }});
            trxs = transactions.find({ 'from_wallet_id': { '$eq': currWallet.wallet_id }});
            // trxs is an array
            if (trxs.length!==0) {
                // remember current balance accounts for sends and receives, we're just removing checking against sends
                var recalcBalance = currWallet.balance;
                for (var j=0;j<trxs.length;j++) {
                    var originalAttackedWallet = null;
                    // check for invalid trx amounts
                    if (parseFloat(trxs[j].amount)<0) {
                        logger(`corrupt trx ${trxs[j]['$loki']} /w ${trxs[j].amount}`);
                        // reverse trx
                        logger(`sending ${Math.abs(trxs[j].amount)} back to ${trxs[j].to_wallet_id} from bad ${trxs[j].from_wallet_id}`);
                        // would investigate here recursively if we did a coin trace instead - we're not
                    } else {
                        // account for trx, this won't necessarily trace back money, only fix trxs that are impossible, and compensate
                        if (recalcBalance >= trxs[j].amount) {
                            recalcBalance -= parseFloat(trxs[j].amount);
                        } else {
                            // impossible trx (because we ignored neg trxs from if) - have to void this trx - how? 
                            // set this bad trx and wallet as a referral - go to wallet it got sent to 
                            // look for trx in this wallet with same amount and from set to referral - take that trx's id
                            // search for trxs greater than that trx's id , if none then subtract from that wallet's balance, remove trx
                            // if final SENT trx
                            if (j==(trxs.length-1)) {
                                
                            }
                        }
                    }
                }
            }
            return trxs;
        }
        // TEST:
        try {
            // lokijs index starts at 1
            for(var i=50;i<80;i++) {
                var updatedTrxs = checkTrxsByWallet(i);
                if (updatedTrxs===undefined || updatedTrxs===null) logger('No trxs for wallet or trxs good.');
            }
        } catch (error) {
            logger(error);
        }
    }
    // clean trxs
    cleanRecursiveInvalidWallets();
}
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

function DBInitFinished() {

// This is used by the socket io heartbeat
var hbeat = {};

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
    firebaseDB.ref('telemetry/' + new Date().toString()).set({
        "active_miners": activeMiners.length,
    });
}, TELEMETRY_INTERVAL);

/*
    Team stats
*/
var TEAM_STATS_INTERVAL = 5000; // 30s
var teamStatsCache;
setInterval(() => {
    teamStatsCache = getTeamStats();
    io.emit('teamStatsUpdate', teamStatsCache);
}, TEAM_STATS_INTERVAL);


/*
    Socket.io stuff
*/

io.on('connection', function(client) {
    connectedClientsCount++;

    client.emit('teamStatsUpdate', teamStatsCache);

    client.on('requestWallet', function(callback) {
        // Validate input
        if (typeof callback !== "function") return;
        console.log("Wallet requested");
        var wallet = createWallet();
        callback(wallet);
    });

    client.on('haveWallet', function(walletInfo) {
        if (typeof walletInfo !== "object") return;
        var walletId = walletInfo['wallet_id'];
        var walletKey = walletInfo['wallet_key'];

        // If we didn't get the right params, reject the client connection
        if(!walletId || !walletKey) {
            return { err: "Expected wallet_id and wallet_key" };
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
                created: new Date(),
                team: "",
            });
        } else {
            // Sanity check that the key is the same
            if (existingWallet.wallet_key !== walletKey) {
                console.log("This shouldn't happen - existing wallet exists with mismatching key");
                console.log("Expected: " + existingWallet.wallet_key);
                console.log("Got: " + walletKey);
                client.disconnect(); // Don't fuck us up anymore
            }
        }

        // Give them their list of transactions
        client.emit('updateTransactions', getTransactionsForWallet(client.wallet_id));

        // Give them their current balance
        var walletObject = wallets.findObject({ wallet_id: client.wallet_id });
        if(walletObject) {
            client.emit('updateBalance', walletObject.balance);
        }

        // Add client to our global list
        if(!clientsForWallet[walletId]) {
            clientsForWallet[walletId] = [];
        }
        clientsForWallet[walletId].push(client);

        console.log("Wallet joined: " + walletId);
    });

    client.on('send', function(transaction) {
        if (typeof transaction !== "object") return;
        var from_wallet_id = transaction.from_wallet_id;
        var from_wallet_key = transaction.from_wallet_key;
        var to_wallet_id = transaction.to_wallet_id;
        var amount = transaction.amount;
        // invalidate bad amounts
        if (isNaN(amount) || amount<0 || parseFloat(amount)%1!==0) return;
        if (!(from_wallet_id && from_wallet_key && to_wallet_id && amount)) return;

        var senderWallet = wallets.findObject({wallet_id: from_wallet_id});
        var receiverWallet = wallets.findObject({wallet_id: to_wallet_id});

        if(!senderWallet || !receiverWallet) return;

        if ((senderWallet.balance >= amount) && (senderWallet.wallet_key == from_wallet_key)) {
            var newBalances = createTransaction(amount, from_wallet_id, to_wallet_id);
            if (!newBalances) return;
            
            // Let both the from and to clients know that the transaction happened (if they're connected)
            if(clientsForWallet[to_wallet_id]) {
                clientsForWallet[to_wallet_id].map((c) => {
                    c.emit('updateTransactions', getTransactionsForWallet(to_wallet_id));
                    c.emit('updateBalance', newBalances.toBalance);
                });
            }

            if(clientsForWallet[from_wallet_id]) {
                clientsForWallet[from_wallet_id].map((c) => {
                    c.emit('updateTransactions', getTransactionsForWallet(from_wallet_id));
                    c.emit('updateBalance', newBalances.fromBalance);
                });
            }

            console.log("Sent " + amount + " from " + from_wallet_id + " to " + to_wallet_id);
        }
    });

    client.on('miningHeartbeat', function() {
        //console.log("Hbeat");
        hbeat[client.id] = Date.now();

        setTimeout(() => {
            var now = Date.now();
            if (now - hbeat[client.id] > CONFIG_HEARTBEAT_TIMEOUT) {
                console.log("Socket timed out: Heartbeat failed");

                // Remove from active miners (if it exists)
                var index = activeMiners.indexOf(client);
                if (index > -1) {
                    activeMiners.splice(index, 1);
                }
            }
        }, CONFIG_HEARTBEAT_TIMEOUT);
    });

    client.on('setTeam', function(team) {
        if (typeof team !== "string") return;
        // Team has to be part of the supported list
        if (CONFIG_SUPPORTED_TEAMS.indexOf(team) === -1) {
            return;
        }
        var walletRecord = wallets.findObject({ wallet_id: client.wallet_id});
        if(!walletRecord) return;
        walletRecord.team = team;
        wallets.update(walletRecord);

        console.log(client.wallet_id + " joined team " + team);
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
        var walletClients = clientsForWallet[client.wallet_id];
        if(walletClients) {
            var index = clientsForWallet[client.wallet_id].indexOf(client);
            if (index > -1) {
                clientsForWallet[client.wallet_id].splice(index , 1);
            }
        }
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
            result.balance = parseFloat(result.balance) + parseFloat(amountEach);
            wallets.update(result);
            paidClients.push(walletId);
        }

        // Update every client with that wallet id
        if(clientsForWallet[walletId]) {
            for(var j = 0; j < clientsForWallet[walletId].length; j++) {
                clientsForWallet[walletId][j].emit('updateBalance', result.balance)
            }
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
        created: new Date(),
        team: "none",
    });
    console.log("Created wallet: " + id);
    return {wallet_id: id, wallet_key: key};
}

function createTransaction(amount, from_wallet_id, to_wallet_id,time=new Date()) {
    transactions.insert({
        from_wallet_id: from_wallet_id,
        to_wallet_id: to_wallet_id,
        amount: amount,
        time: time
    });

    var fromWallet = wallets.findObject({"wallet_id": from_wallet_id});
    if(!fromWallet) return;
    fromWallet.balance = parseFloat(fromWallet.balance) - parseFloat(amount);
    
    var toWallet = wallets.findObject({"wallet_id": to_wallet_id});
    if(!toWallet) return;
    toWallet.balance = parseFloat(toWallet.balance) + parseFloat(amount);

    var newBalances = {"fromBalance": fromWallet.balance, "toBalance": toWallet.balance};

    return newBalances;
}

function getTransactionsForWallet(walletId) {
    var txs = transactions.find({
        '$or': [
            {
                'to_wallet_id': walletId
            },
            {
                'from_wallet_id': walletId
            }
        ]
    });

    return txs;
}

function getTeamStats() {
    var teamTotals = {};
    for(var i = 0; i < CONFIG_SUPPORTED_TEAMS.length; i++) {
        teamTotals[CONFIG_SUPPORTED_TEAMS[i]] = 0;
    }
    var allWallets = wallets.find();

    for(var i = 0; i < allWallets.length; i++) {
        var w = allWallets[i];
        if(w.team) {
            // check if not NaN AFTER attempted parse
            if(!isNaN(parseFloat(w.balance))) {
                teamTotals[w.team] += parseFloat(w.balance);
            } else {
                teamTotals[w.team] += 0.0;
            }
        }
    }

    return teamTotals;
}
}