import openSocket from 'socket.io-client';

var socket;
var subscribers = {};
var state = {
    balance: 0,
    wallet_id: '',
    transactions: []
};

var setState = (key, value) => {
    state[key] = value;
    Object.values(subscribers).map((subscriber) => {
        subscriber(state);
    })
};

var unsubscribe = (name) => {
    delete subscribers[name];
}

var subscribe = (name, subscriber) => {
    subscribers[name] = subscriber;
    // Connect to server
    if (socket === undefined) {
        var port = process.env.NODE_ENV === "production" ? 80 : 3001;
        socket = openSocket('http://localhost:'+port);
        socket.on('connect', () => {
            console.log("Connected to server");

            // Does this machine have a wallet already?
            var wallet = window.localStorage.getItem('wallet_id');
            // If not, get one!
            if (wallet === undefined || wallet === null || wallet.length === 0) {
                console.log("Requesting wallet");
                socket.emit('requestWallet', (walletData) => {
                console.log("Got wallet!");
                console.log(walletData);
                window.localStorage.setItem('wallet_data', walletData['wallet_id']);
                window.localStorage.setItem('wallet_key', walletData['wallet_key'])
                socket.emit('haveWallet', walletData);
                setState('wallet_id', walletData['wallet_id']);
                });
            } else { // Otherwise, let the server know who you are
                var id = window.localStorage.getItem('wallet_id');
                var key = window.localStorage.getItem('wallet_key')
                console.log("Already have wallet: " + id);
                socket.emit('haveWallet', {"wallet_id": id, "wallet_key": key});
                setState('wallet_id', id);
            }

            // SOCKET EVENT LISTENERS
            // updateBalance 
            socket.on('updateBalance', (newBalance) => {
                setState('balance', newBalance);
            });
        })
    }
}

var Connection = {subscribe, unsubscribe};

export {Connection};



