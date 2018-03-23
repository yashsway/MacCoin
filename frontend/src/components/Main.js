import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from "react-router-dom";
import { Connection } from '../utils/connection.js'
import {BarChart,Legend} from 'react-easy-chart';

import '../styles/Main.css';

class Main extends Component {
  constructor(props) {
    super(props);
    this.colors = ["#B10DC9", "#3D9970", "#FF4136", "#0074D9", "#001f3f", "#7FDBFF", "#FFDC00", "#01FF70", "#39CCCC"];
    var colorConfig = [];
    this.colors.map( (c) => {
      colorConfig.push({
        "color": c
      });
    })
    this.quotes = ['“No personal information required” - Mark Zuckerberg', '“A holistic coinage solution” - Steve Jobs', '“Donate to Malaria relief” - Bill Gates', '"01001100 01001001 01001110 01010101 01011000" - Linus Torvalds', '“Give this to me instead”. - Gabe Newell', '“Equivalent in value to an 80 hour work week” - Jeff Bezos', '“I actually coded this, these damn students stole credit for my work” - Steve “The Woz” Wozniak', '“Why didn’t I think of this?” - Satoshi'];
    this.state = {
      quote: this.quotes[Math.floor(Math.random() * this.quotes.length)],
      graphData: [],
      legendConfig: colorConfig
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
      this.setState({graphData: newData});
    }

  }

  render() {
    const { quote } = this.state;

    return (

      <div className='block main-page'>
        <div className='block main-section'>
          <div className='container'>
            <div className='flex flex-column flex-nowrap items-center'>
              <div className='flex-shrink f1 p-font p-color pt5'>MacCoin</div>
              <div className='flex-shrink f3 s-font c-d-color pb5'>{quote}</div>
              <div className='flex-grow'>
                <div className ='center'>
                  <BarChart className='lb-chart' data={this.state.graphData} />
                </div>
                <div className = 'center' >
                    <Legend className='lb-legend' data={this.state.graphData} dataId={'x'} config={this.state.legendConfig} horizontal />
                </div></div>
                <h2 className='p-font f4'>This chart above updates live and shows the aggregate wealth of your friends on campus.</h2>
              <div className='flex-grow pv5'>
                <h2 className='s-font f3 it'>What are <span className='highlight'>you</span> waiting for?</h2>
                <LinkContainer to='/mining'>
                  <Button className='btn-primary' bsSize='large'>Start Mining!</Button>
                </LinkContainer>
              </div>
            </div>
          </div>
        </div>
        <div className='block footer-section'>
          <div className='flex flex-row p-font footer-container pa4'>
            <div className='flex-grow center-text footer-part location-part content'>
              <div className='flex flex-column justify-center'>
                <div className='flex-shrink self-center'>
                  McMaster University, Hamilton, Canada
                </div>
              </div>
            </div>
            <div className='flex-grow  center-text footer-part credit-part content'>
              <div className='flex flex-column justify-center'>
                <div className='flex-shrink self-center'>
                  Software Engineering Class of 2018 | Built with ❤️ <div className='credits'>by the knaves</div>
                </div>
              </div>
            </div>
            <div className='flex-grow center-text footer-part who-part content'>
              <div className='flex flex-column justify-center'>
                <div className='flex-shrink self-center'>
                  <Link className='white-link' to='/about'>What is this?</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Main;
