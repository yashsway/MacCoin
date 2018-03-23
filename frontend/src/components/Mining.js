import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import Nav from './Nav';
import { Connection } from '../utils/connection.js'

import '../styles/Mining.css';
import { createConnection } from 'net';

class Mining extends Component {
  constructor(props) {
    super(props);
    this.initialized = false;
    this.state = {
      balance: 0,
      walletID: '-'
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    Connection.subscribe("mining", this.updateState);
    // Start the heartbeat
    this.heartbeat = setInterval(() => {
      Connection.emit('miningHeartbeat');
    }, 15000);
    Connection.emit('miningHeartbeat');

    window.onblur = this.stopMining;
    window.onfocus = this.startMining;
  }

  componentWillUnmount() {
    clearInterval(this.heartbeat);
    this.stopMining();
    Connection.unsubscribe("mining");
    window.onblur = null;
    window.onfocus = null;
  }

  updateState(state) {
    if (!this.initalized && document.hasFocus()){
      this.startMining();
    }
    this.initalized = true;
    console.log(state);
    this.setState({balance: Math.round(state.balance), walletID: state.wallet_id});
  }

  stopMining() {
    Connection.emit('stopMining', {});
  }

  startMining() {
    Connection.emit('startMining', {});
  }

  render() {
    const { balance, walletID } = this.state;

    return (
      <div className='mining-page'>
        <Nav current='mining'/>
        <div className='balance-container'>
          <p className='center small-heading mining-text'>Mining:</p>
          <div className='center'>
            <img className='mining-gif' src='https://media.giphy.com/media/cnCnU42hrY0Ew/giphy.gif'></img>
          </div>
          <p className='center small-heading'>Balance: {balance == 0 ? '-' : balance + 'm'}</p>
          <p className='center small-heading'>Wallet ID: {walletID}</p>
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
