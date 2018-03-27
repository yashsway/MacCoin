import React, { Component } from 'react';
import { Button, FormControl, ControlLabel, FormGroup } from 'react-bootstrap';
import { Link } from "react-router-dom";
import Popup from "reactjs-popup";
import moment from 'moment';

import Nav from './Nav';
import { Connection } from '../utils/connection.js'

import '../styles/Wallet.css';
import CoinIcon from '../assets/mcoin.png';

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
    this.getValidationState = this.getValidationState.bind(this);
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

  getValidationState(type) {
    const amt = this.state.sendAmount;
    if (isNaN(parseInt(amt)) || (amt < 0) || (amt%1!==0) || amt.toString().includes('.')) { 
      return type=='form' ? 'error' : true;
    }
    else if (amt > 0) { 
      return type=='form' ? 'success' : false;
    }
    else { 
      return null;
    }
  }

  updateTeam(teamName) {
    console.log("set team");
    Connection.setState('team', teamName);
    Connection.emit('setTeam', teamName);
    window.localStorage.setItem('team', teamName);
  }

  render() {
    const { sendAmount, recieverID, walletID, balance, team, transactions } = this.state;

    return (
      <div className='block wallet-page pa5'>
      <div className='block header-section'>
        <div className='container'>
          <div className='flex flex-row flex-nowrap justify-end'>
            <div className='flex-auto f1 p-font p-color'><Link className={'unstyle-link'} to='/'>MacCoin</Link><img className='coin-icon_25' src={CoinIcon}></img></div>
            <div className='flex-auto f1 p-font p-color'>
              <Nav current='wallet'/>
            </div>
          </div>
        </div>
      </div>
      <div className='block main-section'>
        <div className='container'>
          <h2 className='f3'>Your Wallet:</h2>
          <div className='flex flex-column flex-wrap f4'>
            <div className='wallet-piece'>id: {walletID}</div>
            <div className='wallet-piece'>balance: {balance}<img className='coin-icon_25' src={CoinIcon}></img></div>
            <Popup trigger={<Button className='flex-auto flex-shrink mv3 btn-secondary wallet-action'>Send coin to a friend</Button>} modal closeOnDocumentClick>
            { close => (
              <div>
                <FormGroup controlId='formSendCoin' validationState={this.getValidationState('form')}>
                  <p className='small-heading'>Balance: {balance}<img className='coin-icon_25' src={CoinIcon}></img></p>
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
                    <Button className='btn-dark' disabled={this.getValidationState('btn')} bsSize='large' onClick={() => {
                      this.sendTransaction();
                      close();
                    }}>Send</Button>
                  </div>
                </FormGroup>
              </div>)
            }
          </Popup>
          <ControlLabel className='p-font f3'>Team: </ControlLabel>
          <div className='pv3'>Pick a team to help in the <Link className={'bare-link'} to='/'>leaderboards!</Link> Your wealth will count towards the team you pick.</div>
          <FormControl
            className='dropdown-primary'
            type='select'
            componentClass='select'
            value={team}
            onChange={(event) => this.updateTeam(event.target.value)}>
            <option value='none'>Select a team</option>
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
        </div>
      </div>
      <div className='block transaction-section'>
        <div className='container'>
          <h2 className='f3'>Transaction History:</h2>
          <div className='flex flex-column transactions-container'>
            { transactions.map((t) => {
              return <div key={t.$loki} className={`info-box ${t.from_wallet_id == walletID ? 'sent' :'received'}`}> {t.from_wallet_id == walletID ? 'Sent' :'Recieved'} {t.amount}mcoin {t.from_wallet_id == walletID ? 'to' : 'from'} {t.from_wallet_id == walletID ? `${t.to_wallet_id} from ${t.from_wallet_id}` : `${t.from_wallet_id} to ${t.to_wallet_id}`} on {moment(t.time).format('LLLL')}</div>
            })}
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

export default Wallet;
