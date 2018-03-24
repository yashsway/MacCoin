var Loki = require('lokijs');
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

        clean();
    },
    autosave: true,
    autosaveInterval: 2500,
});

function clean() {
    var errs = transactions.find({ amount:{'$jlt': 0}});
    console.log(`errors found: ${errs.length}`);
    for (var i=0;i<errs.length;i++) {
        if (isNaN(errs[i].amount)) {
            transactions.remove(errs[i]);
        };
        var fixed = transactions.find({ amount: {'$eq': Math.abs(errs[i].amount)}, from_wallet_id: { '$eq': errs[i].from_wallet_id}, to_wallet_id: { '$eq': errs[i].to_wallet_id }, time: {'$eq':errs[i].time} });
        if (fixed.length) {
            console.log(`fixing tr ${i} at ${errs[i].time} from ${errs[i].from_wallet_id} to ${errs[i].to_wallet_id}, amount: ${Math.abs(errs[i].amount)}`);
            createTransaction(Math.abs(errs[i].amount),errs[i].from_wallet_id,errs[i].to_wallet_id,errs[i].time);
        } else {
            console.log(`no fix tr ${i}`);
        }
    }
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