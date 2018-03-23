import React, { Component } from 'react';
import { Button, FormControl, ControlLabel } from 'react-bootstrap';
import { Link } from "react-router-dom";
import Popup from "reactjs-popup";

import Nav from './Nav';

import '../styles/Wallet.css';

class Wallet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sendAmount: '',
      recieverID: ''
    };
  }

  sendTransaction() {
    // Send transaction to backend.
    console.log(this.state.sendAmount, this.state.recieverID);
  }

  render() {
    const { sendAmount, recieverID} = this.state;

    return (
      <div className='block wallet-page pa5'>
      <div className='block header-section'>
        <div className='container'>
          <div className='flex flex-row flex-nowrap justify-end'>
            <div className='flex-auto f1 p-font p-color'><Link className={'unstyle-link'} to='/'>MacCoin</Link></div>
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
            <div className='wallet-piece'>id: {'bvger'}</div>
            <div className='wallet-piece'>balance: {78324}m</div>
            <Popup trigger={<Button className='flex-auto flex-shrink mv3 btn-secondary'>Send coin to a friend</Button>} modal closeOnDocumentClick>
            { close => (
              <div>
                <p className='small-heading'>Balance: {3284}m</p>
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
        </div>
      </div>
      <div className='block transaction-section'>
        <div className='container'>
          <h2 className='f3'>Transaction History:</h2>
          <div className='flex flex-column transactions-container'>
            <div className='info-box'>Recieved 400m from kda29 on Friday, March 23, 3:00pm</div>
            <div className='info-box'>Sent 40m to kda29 on Friday, March 23, 3:00pm</div>
            <div className='info-box'>Recieved 400m from kjnf29 on Friday, March 23, 3:00pm</div>
            <div className='info-box'>Recieved 400m from kda29 on Friday, March 23, 3:00pm</div>
            <div className='info-box'>Sent 40m to kda29 on Friday, March 23, 3:00pm</div>
            <div className='info-box'>Recieved 400m from kjnf29 on Friday, March 23, 3:00pm</div>
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
