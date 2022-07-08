
//  SYNTH.JS - Javascript lib for synthesizing Sleep Architectures

// Population Data Sleep Averages by Age
sleepAvgs = [ {Age: 5, TST: 536, Deep: 193, REM: 108, Light: 235, WakeT: 6},
  {Age: 10, TST: 525, Deep: 156, REM: 115, Light: 254, WakeT: 10},
  {Age: 15, TST: 465, Deep: 107, REM: 102, Light: 256, WakeT: 16},
  {Age: 25, TST: 430, Deep: 74, REM: 100, Light: 256, WakeT: 20},
  {Age: 35, TST: 396, Deep: 57, REM: 91, Light: 248, WakeT: 23},
  {Age: 45, TST: 380, Deep: 60, REM: 83, Light: 237, WakeT: 39},
  {Age: 55, TST: 380, Deep: 72, REM: 83, Light: 225, WakeT: 49},
  {Age: 65, TST: 364, Deep: 49, REM: 70, Light: 245, WakeT: 61},
  {Age: 75, TST: 343, Deep: 42, REM: 66, Light: 235, WakeT: 78},
  {Age: 85, TST: 319, Deep: 20, REM: 69, Light: 230, WakeT: 82},
];

// Top level request to synthesize a sleep model and display it as a Hypno Chart
async function synthSleep() {

  var resultsPanelEl = document.getElementById("sleep-data");  
  var synthedSleep = null;

  initializePage();
  cleanUpAllCharts();

  lastSleepDiv = document.getElementById("lastSleep-amt");

  resultsPanelEl.style.display = "block";   
  lastSleepDiv.style.display = "block";

  // Synthesize a Sleep Architecture for 10 last night to 6:30 this morning for a 60 male
  const divEl = "chart-area1";
  const startTime = LastNight(22, 30);
  const endTime = ThisMorning(7, 15);

  sleepArch = SynthHypno(startTime, endTime, 20);
  console.log("Synthesized Hypno = " + sleepArch.hypno);
  gCharts.push(CreateHypnoChart(divEl, "Synthesized", startTime, endTime, sleepArch));

  return (testHypno);
}

function createSleepState(state, cycleNo, t, age) {
  const millisecToMin = 60000;
  var start, end;

  switch (state) {
    case "Wake"  : 
        start = t;    // wake goes up with age
        ageCycleMins = (9 * age/10)/(8);
        end = t + (millisecToMin * (ageCycleMins + getRandomInt(5)));
        break;
    case "Light" :
        start = t;
        end = t + (millisecToMin * (20 + getRandomInt(5)));
        break;
    case "Deep" :
        start = t;
        deepCycleMins = (160 - age/10)/(4*3*2);   // deep goes down with age
        end = t + (millisecToMin * (Math.floor(6 - cycleNo) * deepCycleMins)); 
        break;
    case "REM" :
        start = t;
        end = t + (millisecToMin * ((cycleNo*15) + getRandomInt(5)));
        break;
  }
  return({x: state, y: [start, end]});
}

// Synthesizes a SleepArchitecture object based on population data averages and demographic information, and then 'warps'
// this sleep architecture based on the customer-subjective "feel" information
// startTime/endTime :  epoch millisecond start/end times
// age : years
function SynthHypno(startTime, endTime, age) {
  const sleepArch = {hypno: []};
  const cycleStates = ["Wake", "Light", "Deep", "REM"];
  var h;
  var sleepState;

  // Cycle through as many 'P90' cycles as we need to to fill in between 'startTime' and 'endTime' with sleep states
  h = [];
  cycleNo = 0;
  var now = startTime;
  while (now < endTime) {

    for (phase=0; phase < cycleStates.length; phase++) {
      sleepState = createSleepState(cycleStates[phase], cycleNo, now, age); 
      now = sleepState.y[1];
      h.push(sleepState);
      if (sleepState.y[2] >= endTime) {
        sleepState.y[2] = endTime; 
        sleepState.x = "Wake"; 
        break;
      }
    }
    cycleNo++
    console.log("SynthHypno Cycle #" + cycleNo);
  }
  // To make the format match what Jack's APIs return
  sleepArch.hypno = JSON.stringify(h);

  return(sleepArch)
}


// Helper functions for synthesizing hypnos
//======================================================

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

//Helper functino that returns utc epoch time corresponding to Last Night at Hour 
function LastNight(hour, min) {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() -24);  // go back a day
  startDate.setHours(hour, min, 0);
  console.log("Last Night =" + startDate.toLocaleString());
  return startDate.getTime();
}

//Helper functino that returns utc epoch time corresponding to Last Night at Hour 
function ThisMorning(hour, min) {
  const startDate = new Date();
  startDate.setHours(hour, min, 0);
  console.log("This Morning =" + startDate.toLocaleString());
  return startDate.getTime();
}

