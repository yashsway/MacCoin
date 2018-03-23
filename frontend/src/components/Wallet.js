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
      recieverID: '',
      teamValue: ''
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
    console.log(state);
    this.setState({balance: Math.round(state.balance), walletID: state.wallet_id, teamValue: state.teamValue});
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

  updateTeam(team) {
    this.setState({teamValue: team});
    window.localStorage.setItem('team', team);
  }

  render() {
    const { sendAmount, recieverID, walletID, balance, teamValue} = this.state;

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
          <ControlLabel>Team: </ControlLabel>
          <FormControl
            type='select'
            componentClass='select'
            value={teamValue}
            onChange={(event) => this.updateTeam(event.target.value)}>
            <option value=''>Select a team</option>
            <option value='engineering'>Engineering</option>
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
