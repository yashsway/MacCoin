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
    this.state = {
      balance: 0,
      walletID: '-'
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    Connection.subscribe("mining", this.updateState);
    Connection.emit('startMining', {});

    window.onblur = this.stopMining;
    window.onfocus = this.startMining;
  }

  componentWillUnmount() {
    Connection.emit('stopMining', []);
    Connection.unsubscribe("mining");
    window.removeEventListener('onblur', this.stopMining);
    window.removeEventListener('onfocus', this.startMining);
    console.log("REMOVE EVENT LISTENERS");
  }

  updateState(state) {
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
