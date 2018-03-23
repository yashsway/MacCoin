import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from "react-router-dom";

import Nav from './Nav';

import '../styles/About.css';

const About = () => (
  <div className='block about-page'>
  <div className='block header-section'>
    <div className='container pa5'>
      <div className='flex flex-row flex-nowrap justify-end'>
        <div className='flex-auto f1 p-font p-color'><Link className={'unstyle-link'} to='/'>MacCoin</Link></div>
        <div className='flex-auto f1 p-font p-color'>
          <Nav current='about'/>
        </div>
      </div>
    </div>
  </div>
  <div className='block main-section'>
    <div className='container'>
      <div className='center'>
          <div className='about-info'>
          <p>MacCoin is the premier university student planned and operated cryptocurrency mining program! We obfuscate away the hard stuff so you don’t need to know anything!</p>
          <p>If you DO want to know things about crypto, here’s two important things you should know about: wallets and the BLOCKCHAIN</p>
          <p>Wallets: Your MacCoin wallet is exactly like your regular wallet, except nothing inside actually belongs to you and it has no monetary value! Watch your beautiful, beautiful number of MacCoins CLIMB AS HIGH AS THE SKY! IMPRESS YOUR FRIENDS! COLLECT THEM ALL! BECOME A MACCOIN MASTER!</p>
          <p>The BLOCKCHAIN: The BLOCKCHAIN is where the actual cryptocurrency is stored. Using the power of C-R-Y-P-T-O-G-R-A-P-H-Y and M-A-T-H-E-M-A-T-I-C-S, your valueless coinage will in this case continue to be valueless, because we don’t have a real BLOCKCHAIN! You can probably ignore this whole entry! Haha!</p>
          <p>That’s all you need to know about MacCoin! So keep this page open and make $€£¥!</p>
          <p>Disclaimer: There is no monetary value associated with MacCoin. Unless someone buys some off of you, in which case I was never here if the CRA comes around.</p>
          <p>Send us fan mail at mcmastercoin@gmail.com</p>
          </div>
      </div>
    </div>
  </div>
  <div className='block transaction-section'>
    <div className='container'>
    </div>
  </div>
  <div className='block footer-section'>
    <div className='container'>
    </div>
  </div>
</div>
);

export default About;
