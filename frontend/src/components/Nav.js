import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { Button } from 'react-bootstrap';


class Nav extends Component {

  constructor(props) {
    super(props);

    this.state = {
      open: false
    };
  }

  toggle() {
    this.setState({open: !this.state.open})
  }

  render() {
    const { current } = this.props;
    const { open } = this.state;

    return (
      <div >
        <Button className='btn-mac hamburger' bsSize='large' onClick={() => this.toggle()}>
          &#9776;
        </Button>
        <ul className={`nav ${open ? '' : 'closed'}`}>
          <li>
            <Link className={current === 'main' ? 'current' : ''} to="/">MACCOIN</Link>
          </li>
          <li>
            <Link className={current === 'mining' ? 'current' : ''} to="/mining">Mining</Link>
          </li>
          <li>
            <Link className={current === 'wallet' ? 'current' : ''} to="/wallet">Wallet</Link>
          </li>
          <li>
            <Link className={current === 'about' ? 'current' : ''} to="/about">About</Link>
          </li>
        </ul>
      </div>
    );
  }
}

export default Nav;
