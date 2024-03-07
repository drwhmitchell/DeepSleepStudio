// Helper functions for synthesizing hypnos
//======================================================
class SynthUtils {

    static getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }
  
    //Helper functino that returns utc epoch time corresponding to Last Night at Hour 
    static LastNight(hour, min) {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() -24);  // go back a day
      startDate.setHours(hour, min, 0);
      console.log("Last Night =" + startDate.toLocaleString());
      return startDate.getTime();
    } 
  
    //Helper functino that returns utc epoch time corresponding to Last Night at Hour 
    static ThisMorning(hour, min){
      const startDate = new Date();
      startDate.setHours(hour, min, 0);
      console.log("This Morning =" + startDate.toLocaleString());
      return startDate.getTime();
    }
  
    static CountStateTime(state, h) {
      var total = 0;
      h.forEach(element => {
        if (element.x == state) 
          total += (element.y[1] - element.y[0]);
      });
      return(total);
    }
  
    static createSleepState(state, cycleNo, t, age) {
      const millisecToMin = 60000;
      var start, end, ageCycleMins, deepCycleMins;
    
      switch (state) {
        case "Wake"  : 
            start = t;    // wake goes up with age
            ageCycleMins = (9 * age/10)/(8);
            end = t + (millisecToMin * (ageCycleMins + this.getRandomInt(5)));
            break;
        case "Light" :
            start =
            end = t + (millisecToMin * (40 + this.getRandomInt(5)));
            break;
        case "Deep" :
            start = t;
            deepCycleMins = (160 - age/10)/(4*3*2);   // deep goes down with age
            end = t + (millisecToMin * (Math.floor(6 - cycleNo) * deepCycleMins)); 
            break;
        case "REM" :
            start = t;
            end = t + (millisecToMin * ((cycleNo*10) + this.getRandomInt(5)));
            break;
      }
      return({x: state, y: [start, end]});
    }
  
    // function WarpHypno(sleepArch, sleepState, scaleLow, scaleHigh, value) when applied, returns a new Hypno that is “warped” to reflect a bias in the “sleepState”.
    // For example, WarpHypno(h1, “Deep”, 1, 5, 5) corresponds to a survey result of “How Refreseded Do you Feel” and selecting “5” on a 1-5 scale.
    static WarpHypno(sleepArch, sleepState, scaleLow, scaleHigh, value) {
      console.log("Warping Hypno:" + JSON.stringify(sleepArch));
      
        const warpScalePercent = 0.2;
        var warpFactor = 1 + (value - (scaleHigh + scaleLow)/2) * warpScalePercent;  // the multiplier for the warp adjustment
        var stateWidth;
        const sa = JSON.parse(sleepArch.hypno);
        const numStates = sa.length;
        console.log("Num hypno states =" + numStates);
        for (i=0; i<numStates; i++) {
      console.log("i:" + i);
          stateWidth = sa[i].y[1] - sa[i].y[0];
          // if this is one of our warp states, then warp it...
          if (sa[i].x == sleepState) {
      console.log("Found a " + sleepState + " state!");
              sa[i].y[1] = sa[i].y[0] + stateWidth * warpFactor;
              if (i < numStates-1) 
                sa[i+1].y[0] = sa[i].y[1];  //increase/decrease the next state to meet it
          }
        }
        const newSA = {hypno: JSON.stringify(sa)};
        console.log("===>Warpend Hypno:" + newSA);
        return newSA;
      }
  
  
      // Synthesizes a SleepArchitecture object based on population data averages and demographic information, and then 'warps'
      // this sleep architecture based on the customer-subjective "feel" information
      // startTime/endTime :  epoch millisecond start/end times
      // age : years
      static SynthHypno(startTime, endTime, age) {
        const sleepArch = {hypno: []};
        const cycleStates = ["Wake", "Light", "Deep", "REM"];
        var h;
        var sleepState;
        var cycleNo;
        // Cycle through as many 'P90' cycles as we need to to fill in between 'startTime' and 'endTime' with sleep states
        h = [];
        cycleNo = 0;
        var now = startTime;
        while (now < endTime) {
      
          for (let phase=0; phase < cycleStates.length; phase++) {
            sleepState = this.createSleepState(cycleStates[phase], cycleNo, now, age); 
            now = sleepState.y[1];
            if (now >= endTime) {
              console.log("----------------------Breaking cycle to WAKE!!!")
              sleepState.y[1] = endTime; 
              h.push(sleepState);
              h.push({x: "Wake", y: [endTime-1, endTime]});
              break;
            }
            h.push(sleepState);
          }
          cycleNo++
          console.log("SynthHypno Cycle #" + cycleNo);
        }
        // To make the format match what Jack's APIs return
        sleepArch.hypno = JSON.stringify(h);
      
        // Stuff some values into the rest of the Sleep Arch object
        sleepArch.score = 90;
        //   sleepArch.tst = 7 * (60 * 60 * 1000);
        sleepArch.tst = h[h.length-1].y[1] - h[0].y[0];
        sleepArch.timedeep = this.CountStateTime("Deep", h);
        //   sleepArch.timedeep =1.2 * (60 * 60 * 1000);
        sleepArch.timerem = this.CountStateTime("REM", h);
        sleepArch.timeawake = this.CountStateTime("Wake", h);
        return(sleepArch)
      }
  
      static flattenStates(newHypno, origState, newState) {
        newHypno.forEach(function(el) {
          console.log("State: " + el.x + "\n");
          if ((el.x == origState) && ((el.y[1]-el.y[0])/60000) <= 5) {
            console.log("Flattening a WAKE!\n");
            el.x = newState;  // Decrement sleep state
          }
        });
        return newHypno;
      }

      static newFlattenStates(newHypno, amount) {
 
        newHypno.forEach(function(el, index) {
          console.log("State: " + el.x + "\n");
          if (((el.x == 'Light') || (el.x == 'Wake')) && ((el.y[1]-el.y[0])/60000) <= amount) {
            console.log("Flattening a state!\n");
            if (index > 0) el.x = newHypno[index-1].x;  // set the segment name/type to be the same as the prev segment type
          }
        });
        return newHypno;
      }

      static findExtents(jsonHypno, isAppleWatchValid) {
        let min = Date.now();
        let max = 0;
        const padding = 600000;
        let valids;
      
        if (jsonHypno && jsonHypno.length > 0) {
          jsonHypno.forEach(el => {
            valids = el.source !== 'Trued';
            if (valids) {
              console.log(`FIND_EXTENTS: ${el.source}\n`);
              const h = JSON.parse(el.hypno);
              min = Math.min(min, Math.min(...h.map(({ x, y }) => y[0])));
              max = Math.max(max, Math.max(...h.map(({ x, y }) => y[1])));
            }
          });
        }
        console.log(`FIND EXTENTS Final Extents=[${Helpers.dateToLocalString(min)}, ${ Helpers.dateToLocalString(max)}]`);
        return {
          start: min - padding,
          end: max + padding
        };
      }

      static xformAERecs(recList) {
        const newRecList = [];
      
        for (const rec of recList) {
          newRecList.push({ x: rec.x, y: rec.y });
          newRecList.push({ x: rec.x, y: 0 });
        }
        return newRecList;
      }

      static marshallSleepNetHypno(hypno) {
        const hypnoState = ["Catatonic", "Deep", "Light", "REM", "Wake"];
        var newHypno = [];
        hypno.forEach((el, i) => {
          newHypno.push({
            x: el.y[0],
            y: hypnoState.indexOf(el.x)
          });
        });
        newHypno.sort((a, b) => {
          return a.x - b.x
        }); // sort the new array
      
        newHypno.forEach((el, i) => {
          el.x = Helpers.dateToLocalString(el.x);
        }); // now change from epoch secs to real dates
      
        // Finally, add a record onto the end that makes the Hypno work because the final element is there...
        newHypno.push({
          x: Helpers.dateToLocalString(hypno[hypno.length - 1].y[1]),
          y: hypnoState.indexOf(hypno[hypno.length - 1].x)
        });
        return (newHypno);
      }
  
  }