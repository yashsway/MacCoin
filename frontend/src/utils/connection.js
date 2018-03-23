import openSocket from 'socket.io-client';

var socket;
var subscribers = {};
var state = {
    balance: 0,
    wallet_id: '',
    transactions: [],
    teamValue: ''
};

var setState = (key, value) => {
    state[key] = value;
    Object.values(subscribers).map((subscriber) => {
        subscriber(state);
    })
};

var emit = (event, parameters) => {
    console.log(event);
    socket.emit(event, parameters);
}

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
                window.localStorage.setItem('wallet_id', walletData['wallet_id']);
                window.localStorage.setItem('wallet_key', walletData['wallet_key']);
                console.log(walletData['team']);
                socket.emit('haveWallet', walletData);
                setState('wallet_id', walletData['wallet_id']);
                setState('teamValue', window.localStorage.getItem('team'));
                });
            } else { // Otherwise, let the server know who you are
                var id = window.localStorage.getItem('wallet_id');
                var key = window.localStorage.getItem('wallet_key')
                var team = window.localStorage.getItem('team');
                console.log("Already have wallet: " + id);
                socket.emit('haveWallet', {"wallet_id": id, "wallet_key": key});
                setState('wallet_id', id);
                setState('teamValue', team);
            }

            // SOCKET EVENT LISTENERS
            // updateBalance 
            socket.on('updateBalance', (newBalance) => {
                setState('balance', newBalance);
            });
        })
    }
     //Now that we're set up, send the state to the subscriber
     subscriber(state);
}

var Connection = {subscribe, unsubscribe, emit};

export {Connection};



