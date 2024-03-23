class Helpers{
    static epochTimeToHours(epochTime) {
        var elapsedHrs = Math.floor(epochTime / 3600000);
        var elapsedMin = Math.floor(((epochTime / 3600000) - elapsedHrs) * 60);
        return (elapsedHrs.toString() + ":" + elapsedMin.toString().padStart(2, '0'));
    }
    static findSrc(hypnoStats, src) {
        return hypnoStats.find(obj => obj.source === src);
    }
    static dateToLocalString(date){
        let result = new Date(date);
        return result;
    }
    static getDateOffset(date) {
        const padTo2Digits = (num) => {
          return num.toString().padStart(2, '0');
        }
        const difference = (d1, d2) => {
          var date1 = new Date(d1);
          var date2 = new Date(d2);
      
          const date1utc = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
          const date2utc = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
          const day = 1000 * 60 * 60 * 24;
          return (date2utc - date1utc) / day
        }
        // Javascript's Date function is incredibly screwed up, so I need to get today's date in this bizzare way
        var today = new Date();
        var strToday = today.getFullYear() + "-" + padTo2Digits(today.getMonth() + 1) + "-" + padTo2Digits(today.getDate());
        // SleepNet's APIs all use 'date offsets' so I need to use this.
        var dateDelta = difference(date, strToday);
        if ((today.getHours() + today.getTimezoneOffset() / 60) < 24)
          return (dateDelta);
        else
          return (dateDelta + 1);
      }
      static marshallHealthkitRecords(hkType, sleepRec) {
        const newRecList = [];
        
        if (sleepRec) {
          for (const rec of sleepRec) {
            if (rec.recordtype === hkType) {
              const newRec = {
                x: this.dateToLocalString(rec.startdate),
                y: rec.value
              };
              newRecList.push(newRec);
            }
          }
        }
        return newRecList;
      }
      static marshallHealthkitSleepRecords(sleepRec, startTime, endTime) {
        const fullInBedRecs = sleepRec.filter(el => el.recordtype === 'HKCategoryValueSleepAnalysis' && el.value === 1);
        const asleepRecs = sleepRec.filter(el => el.recordtype === 'HKCategoryValueSleepAnalysis' && el.value !== 1);
        const newinBedRecs = [{ x: this.dateToLocalString(startTime), y: 5 }];
      
        fullInBedRecs.forEach(val => {
          newinBedRecs.push({ x: this.dateToLocalString(val.startdate), y: 4 });
          newinBedRecs.push({ x: this.dateToLocalString(val.enddate), y: 5 });
        });
      
        newinBedRecs.push({ x: this.dateToLocalString(endTime), y: 5 });
        console.log(`InBed Recs=${JSON.stringify(newinBedRecs)}`);
        console.log(`Asleep Recs=${JSON.stringify(asleepRecs)}`);
        return [newinBedRecs, asleepRecs];
      }
      static async Fetch(path, options){
        let response;
        await fetch(path, options)
          .then(res => res.json())
          .then(dataBack => {
            if (dataBack) {
              response = dataBack;
            }
          });
        return (response);
      }
      static removeItemByIndex(array, index){
        if (index < 0 || index >= array.length) {
          return array;
        }
        else{
          return array.slice(0, index).concat(array.slice(index + 1));
        }
      }
      static removeChartByID(chart_id){
        let chartHTML = document.getElementById(chart_id);
        chartHTML.innerHTML = "";
      }


      static getNHoursBeforeEpochTime(hours, epochTime){
        // Convert given epoch time to milliseconds
        let givenTime = new Date(epochTime);

        // Set the minutes and seconds to 0 to get the start of the hour
        // givenTime.setMinutes(0);
        // givenTime.setSeconds(0);

        // Subtract 1 hour in milliseconds
        let oneHourBeforeStartOfHour = new Date(givenTime.getTime() - (60 * hours * 60 * 1000));;

        // Return the closest epoch time 1 hour before the start of the hour in milliseconds
        return oneHourBeforeStartOfHour.getTime();
      }
      static getNHoursAfterEpochTime(hours, epochTime){
        // Convert given epoch time to milliseconds
        let givenTime = new Date(epochTime);

        // Set the minutes and seconds to 0 to get the start of the hour
        // givenTime.setMinutes(0);
        // givenTime.setSeconds(0);

        // Subtract 1 hour in milliseconds
        let oneHourAfterStartOfHour = new Date(givenTime.getTime() + (60 *  hours * 60 * 1000));

        // Return the closest epoch time 1 hour before the start of the hour in milliseconds
        return oneHourAfterStartOfHour.getTime();
      }

      static getHoursBetweenEpochTimes(startTime, endTime) {
        let hoursArray = [];
    
        // Convert epoch times to Date objects
        let startDate = new Date(startTime);
        let endDate = new Date(endTime);
    
        // Iterate through each hour between the start and end times
        let currentHour = new Date(startDate);
        while (currentHour <= endDate) {
            // Format the current hour as HH:MM AM/PM
            let formattedHour = currentHour.toLocaleString('en-US', {
                hour: 'numeric',
                hour12: true
            });
            
            // Add the formatted hour to the array
            hoursArray.push(formattedHour);
    
            // Move to the next hour
            currentHour.setTime(currentHour.getTime() + (60 * 60 * 1000));
        }
    
        return hoursArray;
    }

    static convertMinutesToHHMM(minutes) {
      var hours = Math.floor(minutes / 60);
      var remainingMinutes = minutes % 60;
  
      var hoursString = String(hours).padStart(2, '0');
      var minutesString = String(remainingMinutes).padStart(2, '0');
  
      return hoursString + ':' + minutesString;
  }
    
}