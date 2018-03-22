import React from 'react';
import { Link } from "react-router-dom";

// import '../styles/Nav.css';

const Nav = ({current}) => (
  <ul className='nav'>
    <li>
      <Link className={current == 'main' ? 'current' : ''} to="/">MACCOIN</Link>
    </li>
    <li>
      <Link className={current == 'mining' ? 'current' : ''} to="/mining">Mine</Link>
    </li>
    <li>
      <Link className={current == 'wallet' ? 'current' : ''} to="/wallet">Wallet</Link>
    </li>
    <li>
      <Link className={current == 'about' ? 'current' : ''} to="/about">About</Link>
    </li>
  </ul>
);

export default Nav;
