import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Chart from 'chart.js';
import { Connection } from '../utils/connection.js'
//import {BarChart} from 'react-chartjs';
//import {BarChart,Legend} from 'react-easy-chart';

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

  // componentDidMount() {
  //   var ctx = document.getElementById("myChart").getContext('2d');
  //   var myChart = new Chart(ctx, {
  //       type: 'bar',
  //       data: {
  //           labels: ["Engineering", "Science", "ArtSci", "Humanities", "HealthSci", "Commerce"],
  //           datasets: [{
  //               label: '# coins mined',
  //               data: [12, 19, 3, 5, 2, 3],
  //               backgroundColor: [
  //                   'rgba(255, 99, 132, 0.2)',
  //                   'rgba(54, 162, 235, 0.2)',
  //                   'rgba(255, 206, 86, 0.2)',
  //                   'rgba(75, 192, 192, 0.2)',
  //                   'rgba(153, 102, 255, 0.2)',
  //                   'rgba(255, 159, 64, 0.2)'
  //               ],
  //               borderColor: [
  //                   'rgba(255,99,132,1)',
  //                   'rgba(54, 162, 235, 1)',
  //                   'rgba(255, 206, 86, 1)',
  //                   'rgba(75, 192, 192, 1)',
  //                   'rgba(153, 102, 255, 1)',
  //                   'rgba(255, 159, 64, 1)'
  //               ],
  //               borderWidth: 1
  //           }]
  //       },
  //       options: {
  //           scales: {
  //               yAxes: [{
  //                   ticks: {
  //                       beginAtZero:true
  //                   }
  //               }]
  //           }
  //       }
  //   });
  // }

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
                {/* add graph component here */}
                <canvas id='myChart' width={400} height={400}></canvas>
              </div>
              <div className='flex-grow'>
                <LinkContainer to='/mining'>
                  <Button className='btn-primary' bsSize='large'>Start Mining!</Button>
                </LinkContainer>
              </div>
            </div>
          </div>
        </div>
        <div className='block footer-section'>
          <div className='flex flex-row p-font footer-container'>
            <div className='flex-auto flex-shrink-1 center-text footer-part location-part content'>
              <div className='flex flex-column justify-center h100'>
                <div className='flex-shrink self-center'>
                  Hamilton
                </div>
              </div>
            </div>
            <div className='flex-auto flex-shrink-1 center-text pa4 footer-part credit-part'>
              <div className='flex flex-column justify-center h100'>
                <div className='flex-shrink self-center'>
                  Software 2018
                </div>
              </div>
            </div>
            <div className='flex-auto flex-shrink-1 center-text pa4 footer-part who-part'>
              <div className='flex flex-column justify-center h100'>
                <div className='flex-shrink self-center'>
                  What is this?
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
