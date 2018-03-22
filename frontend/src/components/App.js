import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Main from './Main';
import Mining from './Mining';
import Wallet from './Wallet';
import About from './About';

import '../styles/App.css';

const App = () => (
  <Router>
    <div className='router-root'>
      <Route exact path="/" component={Main} />
      <Route path="/mining" component={Mining} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/about" component={About} />
    </div>
  </Router>
);

export default App;
