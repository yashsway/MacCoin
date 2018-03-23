import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Connection } from '../utils/connection.js'
//import {BarChart} from 'react-chartjs';
import {BarChart} from 'react-easy-chart';
import {Legend} from 'react-easy-chart';

import '../styles/Main.css';

class Main extends Component {
  constructor(props) {
    super(props);
    this.colors = ["#B10DC9", "#3D9970", "#FF4136", "#0074D9", "#001f3f", "#7FDBFF", "#FFDC00", "#01FF70", "#39CCCC"];
    this.quotes = ['“No personal information required” - Mark Zuckerberg', '“A holistic coinage solution” - Steve Jobs', '“Donate to Malaria relief” - Bill Gates', '"01001100 01001001 01001110 01010101 01011000" - Linus Torvalds', '“Give this to me instead”. - Gabe Newell', '“Equivalent in value to an 80 hour work week” - Jeff Bezos', '“I actually coded this, these damn students stole credit for my work” - Steve “The Woz” Wozniak', '“Why didn’t I think of this?” - Satoshi'];
    this.state = {
      quote: this.quotes[Math.floor(Math.random() * this.quotes.length)],
      graphData: [],
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    Connection.subscribe("wallet", this.updateState);
  }

  componentWillUnmount() {
    Connection.unsubscribe("wallet");
  }
  

  updateState(state) {
    var teamStats = state.teamStats;
    if (teamStats) {
      var newData = [];
      Object.keys(teamStats).map( (key, i) => {
        newData.push({
          "x": key,
          "y": teamStats[key],
          "color": this.colors[i]
        })
      });
      console.log(newData);
      this.setState({graphData: newData});
    }

  }

  render() {
    const { quote } = this.state;

    return (
      <div className='main-page'>
        <div className='heading-block'>
          <h1 className='heading center'>
            MACCOIN
          </h1>
          <p className='center small-heading quotes'>{quote}</p>
        </div>
        <div className ='center'>
        <BarChart
          data={this.state.graphData}
        />
        <Legend data={this.state.graphData} dataId={'x'} />
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
  }
}

export default Main;
