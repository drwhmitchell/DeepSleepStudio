//  SLEEPCHARTS.JS - Package of sleep chart drawing functions




// Dynamically creates a chart sleep data (Hypno, Asleep) added on the to the DOM element passed in
// Returns a ref to the chart object so that it can be cleaned up
function CreateHypnoChart(chartContainerID, titleText, startTime, endTime, sleepArch) {
  console.log("CreateHypnoChart with Start/End=" + startTime + "-" + endTime);
  console.log("HYPNO DATA =" + sleepArch.hypno);
  var h = JSON.parse(sleepArch.hypno);
  var hypnoData = marshallSleepNetHypno(h);
  var newChartElID = "sleepBioChart" + Math.random()*10;

  var chartsHTML = document.getElementById(chartContainerID);
  var newHTMLbuf = [];

  if (titleText === 'SleepSignal_Hypno') titleText = 'DeepSleep AppleWatch';
  // Dynamically append HTML to the 'chartContainerID' DOM element that 
  // creates a div wrapper around a chart element with ID 'newchartElID'
  newHTMLbuf += "<div class='sleep_record_container'";
  newHTMLbuf += " style='height: 300px'>";
  newHTMLbuf +=   "<canvas id='" + newChartElID + "'></canvas>"; 
  newHTMLbuf += "</div>";



  // Tack on a line of stats
  newHTMLbuf += "<div class='text-center' style='background-color: #F5F4F8'>";
  newHTMLbuf += "<small>SCORE " + Math.round(sleepArch.score);
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp TST " + epochTimeToHours(sleepArch.tst) + " hours";
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp DEEP " + epochTimeToHours(CountStateTime("Deep", h)) + " hours";
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp REM " + epochTimeToHours(CountStateTime("REM", h)) + " hours";
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp AWAKE " + epochTimeToHours(CountStateTime("Wake", h)) + " hours";
  newHTMLbuf += "&nbsp&nbsp(Reported)</small><br>";

  // Now show recalc'd values
  newHTMLbuf += "<small>SCORE " + Math.round(sleepArch.score);
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp TST " + epochTimeToHours(h[h.length-1].y[1] - h[0].y[0]) + " hours";
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp DEEP " + epochTimeToHours(sleepArch.timedeep) + " hours";
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp REM " + epochTimeToHours(sleepArch.timerem) + " hours";
  newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp AWAKE " + epochTimeToHours(sleepArch.timeawake) + " hours";
  newHTMLbuf += "&nbsp&nbsp(Calculated)</small></div><br>";

  chartsHTML.innerHTML += newHTMLbuf;   // Append the new HTML
  console.log("Creating new Chart='" + newChartElID + "'");
  var ctx = document.getElementById(newChartElID).getContext('2d');
  const hypnoChart = new Chart(ctx, {
    data: {
        datasets: [{
            type: 'line',
            label: 'Sleep State',
            yAxisID: 'SleepState',
            stepped: true,
            borderColor: "#B6BABB",
            borderWidth : 3,
            fill: false,
            radius: 0,
            data : hypnoData,
 //           animations: {
 //             tension: {
 //               duration: 1000,
 //               easing: 'linear',
 //               from: 1,
 //               to: -0.25,
 //               loop: true,
 //             }
 //           }
          }],
      },
      options: {
        layout: {
          padding: {
              right: 86,
              left: 0,
          }
        },
        
        onClick: (e) => {
              const canvasPosition = Chart.helpers.getRelativePosition(e, hypnoChart);
  
              // Substitute the appropriate scale IDs
              const timeX = hypnoChart.scales.x.getValueForPixel(canvasPosition.x);
              const stateY = hypnoChart.scales.SleepState.getValueForPixel(canvasPosition.SleepState);

//              var activePoint = hypnoChart.getElementAtEvent('onClick');
//              var selectedPoint = activePoint[0];
//              selectedPoint.custom = this.selectedPoint.custom || {};
//              selectedPoint.custom.backgroundColor = 'rgba(128,128,128,1)';
//              selectedPoint.custom.radius = 7;              
              
              console.log("Got Click Event at X=" + timeX);
              console.log("Time=" + new Date(timeX).toLocaleTimeString() + " State=" + JSON.stringify(stateY));
        },

        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend : {
            display: false,
          },
          title: {
            display: true,
            text: titleText,
            font : { size: 18},
          }
        },
        scales: {
          x: {
            min: startTime,
            max: endTime,
            display: true,
            type: 'time',
            time: {
              unit: 'hour',  
              displayFormats: {
                hour: 'h a'
              }
            },
          },
          SleepState: {
            type: 'linear',
            display: true,
            title: {
              display : true,
              text : 'Sleep State',
              font : { size: 18},
            },
            position: 'left',
            min: 0,
            max: 5,
            ticks: {
              beginAtZero: true,
              min: 0,
              max: 5,
              stepSize: 1,
              callback: function(label, index, labels) {
                switch (label) {
                  case 0:
                    return '';
                  case 1:
                    return 'DEEP';
                  case 2:
                    return 'LIGHT';
                   case 3:
                    return 'REM';
                  case 4:
                    return 'WAKE';
                }
              }
            }
          }
        }
      }
  })
  return hypnoChart;
}

// Dynamically creates a chart of biometric information (HR, Motion) added on the to the DOM element passed in
// Returns a ref to the chart object so that it can be cleaned up
function CreateBioChart(chartContainerID, titleText, startTime, endTime, hrData, aeData) {
console.log("CreateBioChart with Start/End=" + new Date(startTime).toLocaleTimeString() + "-" + new Date(endTime).toLocaleTimeString());
//console.log("HR Data =" + JSON.stringify(hrData));
//console.log("AE Data =" + JSON.stringify(aeData));

var newChartElID = "sleepBioChart" + Math.random()*10;
  const aeMax = 3.0;     // scales the ActiveEnergy
 // const aeMax = 10;     // scales the ActiveEnergy
  const hrMin = 50;     // scales the ActiveEnergy
  const hrMax = 90;     // scales the ActiveEnergy
  var chartsHTML = document.getElementById(chartContainerID);
  var newHTMLbuf = [];

  // Dynamically append HTML to the 'chartContainerID' DOM element that 
  // creates a div wrapper around a chart element with ID 'newchartElID'
  newHTMLbuf += "<div class='sleep_record_container'";
  newHTMLbuf += " style='height: 300px'>";
  newHTMLbuf +=   "<canvas id='" + newChartElID + "'></canvas>"; 
  newHTMLbuf += "</div>";

  chartsHTML.innerHTML += newHTMLbuf;   // Append the new HTML
  console.log("Creating new Chart='" + newChartElID + "'");
  var ctx = document.getElementById(newChartElID).getContext('2d');
  const bioChart = new Chart(ctx, {
    data: {
        datasets: [{
            type: 'line',
            label: 'Heartrate',
            yAxisID: 'HR',
            borderColor: '#C70039',	
            backgroundColor: '#C70039',	
            data : hrData,
            animations: {
              tension: {
                duration: 1000,
  //              easing: 'linear',
                from: 1,
                to: -0.25,
                loop: true,
              }
            }
          },{ 
            type: 'line',
            label: 'Motion',
            yAxisID: 'AE',
            borderColor: '#000080',
            backgroundColor: '#000080',	
            pointStyle: 'circle',
            radius: 0,
            stepped: true,
            data : aeData,
          }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend : {
            display: false,
          },
          title: {
            display: false,
            text: titleText,
            font : { size: 18},
          }
        },
        scales: {
          x: {
            display: true,
            type: 'time',
            bounds: 'data',
            min: startTime,
            max: endTime,
            time: {
              unit: 'hour',  
              displayFormats: {
                hour: 'h a'
              },
            },
          },
          HR: {
            type: 'linear',
            display: true,
            title: {
              display : true,
              text : 'Heartrate',
              padding: 15,
              font : { size: 18},
            },
            position: 'left',
          },
          AE: {
            type: 'linear',
            display: true,
            title: {
              display : true,
              text : 'Motion',
              padding: 15,
              font : { size: 18},
            },
            position: 'right',
            min: 0,
            max: aeMax,
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          }
        }
      }
  })
  return bioChart;
}



// Dynamically creates a chart sleep data (Hypno, Asleep) added on the to the DOM element passed in
// Returns a ref to the chart object so that it can be cleaned up
function CreateSleepRecordsChart(chartContainerID, titleText, startTime, endTime, inBedData, asleepData) {
console.log("CreateSleepRecordChart with Start/End=" + startTime + "-" + endTime);
console.log("CreateSleepRecordChart with InBedData=" + JSON.stringify(inBedData));
console.log("CreateSleepRecordChart with AsleepData=" + JSON.stringify(asleepData));

  var newChartElID = "sleepRecordsChart" + Math.random()*10;
  var chartsHTML = document.getElementById(chartContainerID);
  var newHTMLbuf = [];

  // Dynamically append HTML to the 'chartContainerID' DOM element that 
  // creates a div wrapper around a chart element with ID 'newchartElID'
  newHTMLbuf += "<div class='sleep_record_container'";
  newHTMLbuf += " style='height: 150px'>";
  newHTMLbuf +=   "<canvas id='" + newChartElID + "'></canvas>"; 
  newHTMLbuf += "</div>";

 // Tack on a line of stats
 newHTMLbuf += "<div class='text-center' style='background-color: #F5F4F8'>";
 newHTMLbuf += "<small># InBed Records: " + ((inBedData.length)/2 - 1);  // to compensate for the doubled # of points and the added endpoint
 newHTMLbuf += "&nbsp &nbsp &nbsp &nbsp &nbsp# Asleep Records: " + asleepData.length;
// Display InBed Rec Data
 //newHTMLbuf += "<br>"
 //inBedData.forEach((rec, i) => { if (i>0 && i<inBedData.length-1) newHTMLbuf += "[" + new Date(rec.x).toLocaleTimeString() + "] "});
 // Display Asleep Rec Data
 //newHTMLbuf += "<br>"
 //asleepData.forEach((rec, i) => { newHTMLbuf += "[" + new Date(rec.startdate).toLocaleTimeString() + " - " + new Date(rec.enddate).toLocaleTimeString() + "] "});

 newHTMLbuf += "</small></div><br>";

 // Marshall the asleepData records
 var newSleepData = [{x: startTime, y: 2}];   // Seed the new Marshalled Sleep Record array with an "awake" point
 asleepData.forEach((rec, i) => { newSleepData.push({x: rec.startdate, y: 1}); 
                                  newSleepData.push({x: rec.enddate, y: 2}) });
 newSleepData.push({x: endTime, y: 2});   // Postfix the Marshalled Sleep Record array with an "awake" point

  chartsHTML.innerHTML += newHTMLbuf;   // Append the new HTML
  console.log("Creating new Chart='" + newChartElID + "'");
  var ctx = document.getElementById(newChartElID).getContext('2d');
  const sleepRecordsChart = new Chart(ctx, {
    data: {
        datasets: [{
            type: 'line',
            label: 'Sleep Records',
            yAxisID: 'SleepRecs',
            stepped: 'true',
            borderColor: "#B6BABB",
            borderWidth : 3,
            fill: false,
            radius: 0,
            data : newSleepData,
            animations: {
              tension: {
                duration: 1000,
                easing: 'linear',
                from: 1,
                to: -0.25,
                loop: true,
              }
            }
          },{ 
            type: 'line',
            label: 'Inbed Records',
            yAxisID: 'InbedRecs',
            stepped: true,
            borderColor: '#000080',
            borderWidth : 3,
            fill: false,
            radius: 0,
            data : inBedData,
          }, { 
            type: 'line',
            yAxisID: 'SleepRecs',
            stepped: true,
            borderColor: '#000080',
//             backgroundColor: '#000080',	
            borderWidth : 3,
            fill: false,
            radius: 0,
            data : inBedData,
          }],
      },
      options: {
        layout: {
          padding: {
              right: 12,
              left: 7,
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend : {
            display: false,
          },
          title: {
            display: true,
            text: titleText,
            font : { size: 18},
          }
        },
          scales: {
            x: {
              display: true,
              type: 'time',
              time: {
                unit: 'hour',  
                displayFormats: {
                  hour: 'h a'
                }
              }, 
              min: startTime,
              max: endTime,
            },
            SleepRecs: {
              type: 'linear',
              display: true,
              title: {
                display : true,
                text : 'Sleep Recs',
                font : { size: 18},
              },
              position: 'left',
              min: 0,
              max: 6,
              
              ticks: {
                beginAtZero: true,
                min: 0,
                max: 6,
                stepSize: 1,
                callback: function(label, index, labels) {
                  switch (label) {
                    case 0:
                      return '';
                    case 1:
                      return 'SLEEP';
                    case 2:
                      return 'WAKE';

                  }
                }
              }

            },
            InbedRecs: {
              type: 'linear',
              display: true,
              title: {
                display : true,
                text : 'InBed Recs',
                font : { size: 18},
              },
              position: 'right',
              min: 0,
              max: 6,
              grid: {
              drawOnChartArea: true, // only want the grid lines for one axis to show up
              },

              ticks: {
                beginAtZero: true,
                min: 0,
                max: 6,
                stepSize: 1,
                callback: function(label, index, labels) {
                  switch (label) {
                    case 4:
                      return 'INBED';
                    case 5:
                      return ' UP';
                  }
                }
              }

            }
          }
      }
  })
  return sleepRecordsChart;
}
