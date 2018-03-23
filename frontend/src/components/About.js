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
        
      </div>
      <div className='pa3'>

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
