import React from 'react';
import { Button } from 'react-bootstrap';

import Nav from './Nav';

import '../styles/Wallet.css';

const Wallet = () => (
  <div className='wallet-page'>
    <Nav current='wallet'/>
  </div>
);

export default Wallet;
