import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { LinkContainer } from 'react-router-bootstrap';

import Nav from './Nav';
import { Connection } from '../utils/connection.js'

import '../styles/Mining.css';
import { createConnection } from 'net';

class Mining extends Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: 0,
      walletID: '-'
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    Connection.subscribe("mining", this.updateState);
    window.onblur = () => {
      Connection.emit('stopMining');
    };
    window.onfocus = () => {
      Connection.emit('startMining');
    };
  }

  componentWillUnmount() {
    Connection.unsubscribe("mining");
  }

  updateState(state) {
    console.log(state);
    this.setState({balance: Math.round(state.balance), walletID: state.wallet_id});
  }

  render() {
    const { balance, walletID } = this.state;

    return (
      <div className='block mining-page pa5'>
        <div className='block header-section'>
          <div className='container'>
            <div className='flex flex-row flex-nowrap justify-end'>
              <div className='flex-auto f1 p-font p-color'><Link className={'unstyle-link'} to='/'>MacCoin</Link></div>
              <div className='flex-auto f1 p-font p-color'>
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
              <p className='block center-text f2'>Balance: {balance == 0 ? '-' : balance + 'm'}</p>
              <p className='block center-text f3'>Wallet ID: {walletID}</p>
            </div>
          </div>
        </div>
        <div className='block footer-section'>
          <div className='container'>
          </div>
        </div>
      </div>
    );
  }
}

export default Mining;
