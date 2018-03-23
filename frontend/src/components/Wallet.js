import React, { Component } from 'react';
import { Button, FormControl, ControlLabel } from 'react-bootstrap';
import Popup from "reactjs-popup";

import Nav from './Nav';
import { Connection } from '../utils/connection.js'

import '../styles/Wallet.css';

class Wallet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      balance: 0,
      walletID: '',
      sendAmount: '',
      recieverID: ''
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    console.log("WALLET ON");
    Connection.subscribe("wallet", this.updateState);
  }

  componentWillUnmount() {
    Connection.unsubscribe("wallet");
    console.log("WALLET OFF");
  }

  updateState(state) {
    console.log(state);
    this.setState({balance: Math.round(state.balance), walletID: state.wallet_id});
  }

  sendTransaction() {
    // Send transaction to backend.
    console.log(this.state.sendAmount, this.state.recieverID);
    Connection.emit('send', [this.state.sendAmount, this.state.recieverID])
  }

  render() {
    const { sendAmount, recieverID, walletID, balance} = this.state;

    return (
      <div className='wallet-page'>
        <Nav current='wallet'/>
        <p className='center small-heading wallet-header'>Your Wallet:</p>
        <div className='wallet-info center'>
          <div className='info-box'>id: {walletID}</div>
          <div className='info-box'>balance: {balance}m</div>
          <Popup trigger={<Button className='btn-mac' bsSize='large'>Send</Button>} modal closeOnDocumentClick>
            { close => (
              <div>
                <p className='small-heading'>Balance: {balance}m</p>
                <div className='form-row'>
                  <ControlLabel>Amount: </ControlLabel>
                  <FormControl
                    type="number"
                    value={sendAmount}
                    placeholder="Enter amount"
                    onChange={(event) => this.setState({sendAmount: event.target.value})}
                  />
                </div>
                <div className='form-row'>
                  <ControlLabel>Reciever Wallet ID: </ControlLabel>
                  <FormControl
                    type="text"
                    value={recieverID}
                    placeholder="Enter ID"
                    onChange={(event) => this.setState({recieverID: event.target.value})}
                  />
                </div>
                <div className='center'>
                  <Button className='btn-mac' bsSize='large' onClick={() => {
                    this.sendTransaction();
                    close();
                  }}>Send</Button>
                </div>
              </div>)
            }
          </Popup>

        </div>
        <p className='center small-heading wallet-header'>Transaction History:</p>
        <div className='center transactions-container'>
          <div className='info-box'>Recieved 400m from kda29 on Friday, March 23, 3:00pm</div>
          <div className='info-box'>Sent 40m to kda29 on Friday, March 23, 3:00pm</div>
          <div className='info-box'>Recieved 400m from kjnf29 on Friday, March 23, 3:00pm</div>
          <div className='info-box'>Recieved 400m from kda29 on Friday, March 23, 3:00pm</div>
          <div className='info-box'>Sent 40m to kda29 on Friday, March 23, 3:00pm</div>
          <div className='info-box'>Recieved 400m from kjnf29 on Friday, March 23, 3:00pm</div>
        </div>
      </div>
    );
  }
}

export default Wallet;
