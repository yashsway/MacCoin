import React from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import Nav from './Nav';

import '../styles/Mining.css';

const Mining = ({balance}) => (
  <div className='mining-page'>
    <Nav current='mining'/>
    <div className='balance-container'>
      <p className='center small-heading mining-text'>Mining:</p>
      <div className='center'>
        <img className='mining-gif' src='https://media.giphy.com/media/cnCnU42hrY0Ew/giphy.gif'></img>
      </div>
      <p className='center small-heading'>Balance: {3874}m</p>
    </div>
    <div className='center'>
      <LinkContainer to='/wallet'>
        <Button bsStyle='link'>Go to wallet</Button>
      </LinkContainer>
    </div>
  </div>
);

export default Mining;
