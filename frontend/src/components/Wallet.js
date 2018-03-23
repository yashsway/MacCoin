import React, { Component } from 'react';
import { Button, FormControl, ControlLabel } from 'react-bootstrap';
import Popup from "reactjs-popup";
import moment from 'moment';

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
      recieverID: '',
      team: '',
      transactions: []
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    Connection.subscribe("wallet", this.updateState);
  }

  componentWillUnmount() {
    Connection.unsubscribe("wallet");
  }

  updateState(state) {
    this.setState({balance: Math.round(state.balance), walletID: state.wallet_id, team: state.team, transactions: state.transactions});
  }

  sendTransaction() {
    // Send transaction to backend.
    console.log(this.state.sendAmount, this.state.recieverID);
    var params = {
      from_wallet_id: window.localStorage.getItem("wallet_id"),
      from_wallet_key: window.localStorage.getItem("wallet_key"),
      to_wallet_id: this.state.recieverID,
      amount: this.state.sendAmount
    };
    Connection.emit('send', params)
  }

  updateTeam(teamName) {
    console.log("set team");
    Connection.setState('team', teamName);
    Connection.emit('setTeam', teamName);
    window.localStorage.setItem('team', teamName);
  }

  render() {
    const { sendAmount, recieverID, walletID, balance, team, transactions} = this.state;

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
        <div className='form-row faculty-form'>
        <div>
          <ControlLabel>Team: </ControlLabel>
          <Popup trigger={<Button className='btn-mac btn-question'>?</Button>} position="top left" closeOnDocumentClick>
            Pick a team to help in the leaderboards!
          </Popup>
          </div>
          <FormControl
            type='select'
            componentClass='select'
            value={team}
            onChange={(event) => this.updateTeam(event.target.value)}>
            <option value=''>Select a team</option>
            <option value='engineering'>Engineering</option>
            <option value='artsci'>Arts & Science</option>
            <option value='commerce'>Commerce</option>
            <option value='healthsci'>Health Sciences</option>
            <option value='humanities'>Humanities</option>
            <option value='kin'>Kinesiology</option>
            <option value='nursing'>Nursing</option>
            <option value='science'>Science</option>
            <option value='socsci'>Social Sciences</option>
          </FormControl>
        </div>

        <p className='center small-heading wallet-header'>Transaction History:</p>
        <div className='center transactions-container'>
          { transactions.map((t) => {
            return <div key={t.$loki} className='info-box'> {t.from_wallet_id == walletID ? 'Sent' :'Recieved'} {t.amount}m from {t.from_wallet_id} on {moment(t.time).format('LLLL')}</div>
          })}
        </div>
      </div>
    );
  }
}

export default Wallet;
