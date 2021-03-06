import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { LinkContainer } from 'react-router-bootstrap';

import Nav from './Nav';
import { Connection } from '../utils/connection.js'

import '../styles/Mining.css';
import { createConnection } from 'net';
// static assets
import CoinIcon from '../assets/mcoin.png';
import CoinFeat from '../assets/coin-feat.png';

class Mining extends Component {
  constructor(props) {
    super(props);
    this.initialized = false;
    this.state = {
      balance: 0,
      walletID: '-',
      message: 'Connecting to the MacCoin wealth network...'
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

    window.onblur = (function() {
      this.stopMining();
      this.setState({message:'Mining paused! Keep this window in focus to mine.'});
    }).bind(this);
    window.onfocus = (function() {
      this.startMining();
      this.setState({message:'Mining...'});
    }).bind(this);
  }

  componentWillUnmount() {
    clearInterval(this.heartbeat);
    this.stopMining();
    Connection.unsubscribe("mining");
    window.onblur = null;
    window.onfocus = null;
    this.setState({message:''});
  }

  updateState(state) {
    if (!this.initalized && document.hasFocus()){
      this.startMining();
      this.setState({message:'Mining...'});
    }
    this.initalized = true;
    this.setState({balance: Math.round(state.balance), walletID: state.wallet_id});
  }

  stopMining() {
    Connection.emit('stopMining', {});
  }

  startMining() {
    Connection.emit('startMining', {});
  }

  render() {
    const { balance, walletID, message } = this.state;

    return (
      <div className='block mining-page pa5'>
        <div className='block header-section'>
          <div className='container'>
            <div className='flex flex-row flex justify-end header-container'>
              <div className='flex-auto f1 p-font p-color'><Link className={'unstyle-link'} to='/'>MacCoin</Link><img className='coin-icon_50' src={CoinIcon}></img></div>
              <div className='flex-auto flex-grow f1 p-font p-color'>
                <Nav current='mining'/>
              </div>
            </div>
          </div>
        </div>
        <div className='block main-section'>
          <div className='container'>
            <div className='center'>
              <img className='mining-gif' src='https://media.giphy.com/media/cnCnU42hrY0Ew/giphy.gif'></img>
            </div>
            <div className='pa3'>
              <p className='block center-text f2'>Your Wallet Balance: {balance == 0 ? '-' : balance}<img className='coin-icon_25' src={CoinIcon}></img></p>
              <p className='block center-text f3'>Your <span className='highlight'>Unique</span> Wallet ID: {walletID}</p>
              <div className='block center-text f3 s-font it c-d-color'>Status: {message}</div>
            </div>
          </div>
        </div>
        <div className='block message-section'>
          <div className='container pv5'>
            <img className='coin-feat' src={CoinFeat}></img>
          </div>
        </div>
      </div>
    );
  }
}

export default Mining;
