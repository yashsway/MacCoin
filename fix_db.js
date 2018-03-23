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

        DBInitFinished();
    },
    autosave: true,
    autosaveInterval: 3500,
});

function clean() {
    var errs = transactions.find({ amount:{'$jlt': 0}});
    console.log(errs);
    for (var i=0;i<errs.length;i++) {
        if (isNaN(errs[i].amount)) {
            transactions.remove(errs[i]);
        };
        var existing = transactions.find({ amount: {'$eq': Math.abs(errs[i].amount)}, time: {'$eq':errs[i].time} });
        if (existing.length) return;
        console.log(existing);
        var fixT ={
            from_wallet_id: errs[i].from_wallet_id,
            to_wallet_id: errs[i].to_wallet_id,
            amount: Math.abs(errs[i].amount),
            time: new Date()
        };
        createTransaction(fixT.amount,fixT.from_wallet_id,fixT.to_wallet_id);
    }
}