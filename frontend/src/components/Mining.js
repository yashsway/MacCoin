import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import Nav from './Nav';

import '../styles/Mining.css';

import openSocket from 'socket.io-client';

class Mining extends Component {
  constructor(props) {
    super(props);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.state = {
    };
  }

  componentDidMount() {

    // Visibility event listener for activating/deactivating mining
    // First check for proper browser type, but only bind after socket connection!
    var hidden, visibilityChange; 
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }
    this.hidden = hidden;

    // Connect to server
    var port = process.env.NODE_ENV === "production" ? 80 : 3001;
    this.socket = openSocket('http://localhost:'+port);
    console.log("Connected to server");
    this.socket.on('connect', function() {
      // Does this machine have a wallet already?
      var wallet = window.localStorage.getItem('wallet_id');
      // If not, get one!
      if (wallet === undefined || wallet === null || wallet.length === 0) {
        console.log("Requesting wallet");
        this.socket.emit('requestWallet', function(walletData){
          console.log("Got wallet!");
          console.log(walletData);
          window.localStorage.setItem('wallet_data', walletData['wallet_id']);
          window.localStorage.setItem('wallet_key', walletData['wallet_key'])
          this.socket.emit('haveWallet', walletData);
        });
      } else { // Otherwise, let the server know who you are
        var id = window.localStorage.getItem('wallet_id');
        var key = window.localStorage.getItem('wallet_key')
        console.log("Already have wallet: " + id);
        this.socket.emit('haveWallet', {"wallet_id": id, "wallet_key": key});
      }

      // Bind visibility event listener
      document.addEventListener(visibilityChange, this.handleVisibilityChange, false);
    });

  }

  handleVisibilityChange() {
    if (this.socket){
      if (document[this.hidden]) {
        this.socket.emit('stopMining');
      } else {
        this.socket.emit('startMining');
      }
    }
  }

  render() {

    return (
      <div className='mining-page'>
        <Nav current='mining'/>
        <div className='balance-container'>
          <p className='center small-heading mining-text'>Mining:</p>
          <div className='center'>
            <img className='mining-gif' src='https://media.giphy.com/media/cnCnU42hrY0Ew/giphy.gif'></img>
          </div>
          <p className='center small-heading'>Balance: {3874}m</p>
        </div>
        <div className='center'>
          <LinkContainer to='/wallet'>
            <Button bsStyle='link'>Go to wallet</Button>
          </LinkContainer>
        </div>
      </div>
    );
  }
}

export default Mining;
