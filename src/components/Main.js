import React from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import '../styles/Main.css';

const Main = () => (
  <div className='main-page'>
    <div className='heading-block'>
      <h1 className='heading center'>
        MACCOIN
      </h1>
      <p className='center small-heading'>~funny stuff here~</p>
    </div>
    <div className='center btn-wrapper'>
      <LinkContainer to='/mining'>
        <Button className='btn-mac' bsSize='large'>Start Mining!</Button>
      </LinkContainer>
    </div>
    <div className='center'>
      <LinkContainer to='/about'>
        <Button bsStyle='link'>What is MacCoin?</Button>
      </LinkContainer>
    </div>
  </div>
);

export default Main;
