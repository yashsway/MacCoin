import React from 'react';
import { Button } from 'react-bootstrap';

import '../styles/App.css';

const App = () => (
  <div className='main-page'>
    <div className='heading-block'>
      <h1 className='heading center'>
        MACCOIN
      </h1>
      <p className='center subheading'>~funny stuff here~</p>
    </div>
    <div className='center btn-wrapper'>
      <Button className='btn-mac' bsSize='large' href='#'>Start Mining!</Button>
    </div>
    <div className='center'>
      <Button bsStyle='link' href='#'>What is MacCoin?</Button>
    </div>
  </div>
);

export default App;
