import React from 'react';
import { Button } from 'react-bootstrap';

import Nav from './Nav';

import '../styles/Wallet.css';


const Wallet = ({wallet, balance, transactions}) => (
  <div className='wallet-page'>
    <Nav current='wallet'/>
    <p className='center small-heading wallet-header'>Your Wallet:</p>
    <div className='wallet-info center'>
      <div className='info-box'>id: {'bvger'}</div>
      <div className='info-box'>balance: {78324}</div>
      <Button className='btn-mac' bsSize='large'>Send</Button>
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

export default Wallet;
