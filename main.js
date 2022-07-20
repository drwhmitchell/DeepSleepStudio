//  MAIN.JS - Main Javascript code for program




// Main functions ---
// The idea is that we want to create charts that line-up for comparison purposes -- so figure out the extents first, and use them for all

/*
var startTime = "6/6/2022, 1:42:51 AM";
var endTime = "6/6/2022, 5:41:16 AM";
var c1 = CreateHypnoChart('chart-area1', '                  Hypnogram', startTime, endTime, testSSData);   // Yuck, gotta figure out how to center this...
var c2 = CreateBioChart('chart-area2', 'Biometrics', startTime, endTime, testHRData, testAEData);
var c3 = CreateSleepRecordsChart('chart-area3', 'Sleep Records', startTime, endTime, testSRData, testInbedData)
var c4 = CreateHypnoChart('chart-area4', '                  Hypnogram', startTime, endTime, testSSData);   // Yuck, gotta figure out how to center this...
var c5 = CreateBioChart('chart-area5', 'Biometrics', startTime, endTime, testHRData, testAEData);
var c6 = CreateSleepRecordsChart('chart-area6', 'Sleep Records', startTime, endTime, testSRData, testInbedData)
*/

var testHypno = [{"x":"Wake","y":[1657082165000,1657082224000]},
                {"x":"Wake","y":[1657082623000,1657082744000]},
                {"x":"Wake","y":[1657092405000,1657092410000]},
                {"x":"Wake","y":[1657092470000,1657092599000]},
                {"x":"Wake","y":[1657092650000,1657092860000]},
                {"x":"Wake","y":[1657103138000,1657103700000]},
                {"x":"REM","y":[1657095967000,1657097337000]},
                {"x":"REM","y":[1657098436000,1657098830000]},
                {"x":"REM","y":[1657100939000,1657101375000]},
                {"x":"REM","y":[1657108554000,1657109095000]},
                {"x":"REM","y":[1657110802000,1657115191000]},
                {"x":"Light","y":[1657082224000,1657082442000]},
                {"x":"Light","y":[1657082744000,1657082863000]},
                {"x":"Light","y":[1657088170000,1657092405000]},
                {"x":"Light","y":[1657092410000,1657092470000]},
                {"x":"Light","y":[1657092599000,1657092650000]},
                {"x":"Light","y":[1657092860000,1657094889000]},
                {"x":"Light","y":[1657095562000,1657095967000]},
                {"x":"Light","y":[1657097337000,1657098436000]},
                {"x":"Light","y":[1657098830000,1657100939000]},
                {"x":"Light","y":[1657101375000,1657103138000]},
                {"x":"Light","y":[1657103700000,1657103769000]},
                {"x":"Light","y":[1657104242000,1657104908000]},
                {"x":"Light","y":[1657105233000,1657108554000]},
                {"x":"Light","y":[1657109095000,1657110802000]},
                {"x":"Deep","y":[1657082442000,1657082623000]},
                {"x":"Deep","y":[1657082863000,1657088170000]},
                {"x":"Deep","y":[1657094889000,1657095562000]},
                {"x":"Deep","y":[1657103769000,1657104242000]},
                {"x":"Deep","y":[1657104908000,1657105233000]}];



// Password stuff
function password_show_hide() {
  var x = document.getElementById("password");
  var show_eye = document.getElementById("show_eye");
  var hide_eye = document.getElementById("hide_eye");
  hide_eye.classList.remove("d-none");
  if (x.type === "password") {
    x.type = "text";
    show_eye.style.display = "none";
    hide_eye.style.display = "block";
  } else {
    x.type = "password";
    show_eye.style.display = "block";
    hide_eye.style.display = "none";
  }
}

function password_validate() {
  // hide the authentication dialog and display the control panel
  console.log("Password-validate()");

  gIsAuthorized = true;
  initializePage();
}



// gCharts keeps track of the list of charts created so we can destroy them 
var gCharts = []; 
var gViewingUTCOffset = moment().utcOffset();
var gIsAuthorized = false;    // start out unauthorized

// Preset the Date Picker to today's date
const [currentDate, currentTime] = formatDate(new Date()).split(' ');
const dateInput = document.getElementById('myDate');
dateInput.value = currentDate;

// On Page Load function
function initializePage() {
console.log("initializePage()");
  var controlPanelEl = document.getElementById("control-panel"); 
  var resultsPanelEl = document.getElementById("sleep-data");  
  var securityEl = document.getElementById("security");  

  // If we are Authorized, display just the control panel
  if (gIsAuthorized) {
    controlPanelEl.style.display = "block";
    securityEl.style.display = "none";  // Hide login panel
    resultsPanelEl.style.display = "none";   // Hide results panel until we use control panel to generate some
  } else {
    // We're not Authorized yet so just show the security panel and hide the rest
    securityEl.style.display = "block";
    controlPanelEl.style.display = "none";
    resultsPanelEl.style.display = "none";
  }
}

// Find the all 4 models of a Whack2 for a certain date offset
async function findWhack2Models() {
  // First grab the current user token
  var userName = document.getElementById('user-select');
  console.log("Selected User Token =" + userName.value);
  DST = userName.value;
  var day = 0;
  var hypnoMeta;

  // Now try each date offset starting with 0 until we hit a date with a sleep 
  for (i=0; i<4; i++) {
    hypnoMeta = await fetchWhack2Data(DST, i, day);
    console.log('Whack2(' + i + ',' + day + ')=' + '' + JSON.stringify(hypnoMeta));
  }
}


// Find the most recent night of sleep data
async function findLatest() {
  // First grab the current user token
  var userName = document.getElementById('user-select');
  var resultsPanelEl = document.getElementById("sleep-data");  

  initializePage();
  cleanUpAllCharts();

  console.log("Selected User Token =" + userName.value)
  DST = userName.value;

  // Show the progress...


  lastSleepDiv = document.getElementById("lastSleep-amt");
  lastSleepDiv.innerHTML = "";
  lastSleepDiv.innerHTML = "Last synced sleep: ";
  resultsPanelEl.style.display = "block";   
  lastSleepDiv.style.display = "block";

  // Now try each date offset starting with 0 until we hit a date with a sleep 

  var hypnoMeta; 
  var healthKitRecs;
  const maxSleepOffset = 90;
  var lastSleepOffset = maxSleepOffset;
  for (i=0; i<maxSleepOffset; i++) {  
    const hypnoMeta = await fetchHypnoData(i, DST);
    const heathKitRecs = await fetchHealthkitData(i, DST);
    if (hypnoMeta || heathKitRecs) {
      lastSleepOffset = i;
      break;
    }
    lastSleepDiv.innerHTML += ".";
    console.log("Find last Offset #" + i);
  }
  console.log("LastSleepOffset = " + lastSleepOffset);

  if (lastSleepOffset == 0)
    lastSleepDiv.innerHTML += "Last Night";
  else 
    lastSleepDiv.innerHTML +=  lastSleepOffset + " days ago."



  return (lastSleepOffset);
}



// Enter main program here....
function showSleep() {
  // First grab the current user token
  var userName = document.getElementById('user-select');
  console.log("Selected User Token =" + userName.value)
  DST = userName.value;

  // Now grab the date offset
  const datePickerDate = document.getElementById('myDate').value;
  console.log("Date Picker Datet =" + datePickerDate);
  // Javascript's Date function is incredibly screwed up, so I need to get today's date in this bizzare way
  var today = new Date();
  var strToday =  today.getFullYear() + "-" + padTo2Digits(today.getMonth()+1) + "-" + padTo2Digits(today.getDate());
  // SleepNet's APIs all use 'date offsets' so I need to use this.
  var dateDelta = difference(datePickerDate, strToday);
  dateDelta = dateDelta > -1 ? dateDelta : 0;   // Default the sleep offset to 0 if something future picked on the date picker
  console.log("Date Offset =" + dateDelta);
  console.log("gUTCOffset = " + moment().utcOffset());
  console.log("Today UTC Offset = " + today.getTimezoneOffset());

  // -14400000


  initializePage();


  mainProgram(dateDelta, DST);
}


function cleanUpAllCharts() {
  console.log("CleanUpAllCharts with gChartCount =" + gChartCount);
  // Nuke any live charts because we're about to create more....
  gCharts.forEach(chart => { if (chart) chart.destroy() });

  var chartHTML;
  // Also nuke any elements "innerHTML"
  for (i=1; i<gChartCount+1; i++) {
    chartHTML = document.getElementById("chart-area" + i);
console.log("Nuking InnnerHTML of Chart#" + i);
    chartHTML.innerHTML = "";
  }
  gChartCount = 1;
  gCharts = [];
}



const gChartDiv = "chart-area";
var gChartCount = 1;

async function mainProgram(dateOffset, token) {

  // Show chart area
  var sleepDataEl = document.getElementById("sleep-data");
  console.log("Sleep Data DIV state='" + sleepDataEl.style.display + "'");
  sleepDataEl.style.display = "block";

  const hypnoMeta = await fetchHypnoData(dateOffset, token);
  const heathKitRecs = await fetchHealthkitData(dateOffset, token);

  if (hypnoMeta) {
    console.log("***>Successfully Fetched a Hypno: " + JSON.stringify(hypnoMeta));

    cleanUpAllCharts();
  
    // See what our time range is for all records
    var extents = findExtents(hypnoMeta);

    renderHypnoData("SleepSignal_Hypno", gChartDiv + gChartCount++, hypnoMeta, extents[0], extents[1]);
    if (heathKitRecs) {
      const hrRecList = marshallHealthkitRecords('HKQuantityTypeIdentifierHeartRate', heathKitRecs);
      const aeRecList = marshallHealthkitRecords('HKQuantityTypeIdentifierActiveEnergyBurned', heathKitRecs);
      const xformedAErecList = xformAERecs(aeRecList);  // pads out the AE records so they can be used in a Stepped Line chart
      gCharts.push(CreateBioChart(gChartDiv + gChartCount++, 'Biometrics', extents[0], extents[1], hrRecList, xformedAErecList));

      const inBedSleepDataLists = marshallHealthkitSleepRecords(heathKitRecs, extents[0], extents[1]);
      gCharts.push(CreateSleepRecordsChart(gChartDiv + gChartCount++, '', extents[0], extents[1], inBedSleepDataLists[0], inBedSleepDataLists[1]));
    }
    gCharts.push(renderHypnoData("Oura", gChartDiv + gChartCount++, hypnoMeta, extents[0], extents[1]));
    gCharts.push(renderHypnoData("Withings", gChartDiv + gChartCount++, hypnoMeta, extents[0], extents[1]));
    gCharts.push(renderHypnoData("Fitbit", gChartDiv + gChartCount++, hypnoMeta, extents[0], extents[1]));
    gCharts.push(renderHypnoData("Garmin", gChartDiv + gChartCount++, hypnoMeta, extents[0], extents[1]));
  }
}



// Finds the Hypnogram object in the Hypnogram array from source src
function findSrc(hypnoStats, src) {
  return(hypnoStats.find((obj) => {
    return obj.source == src;
  }));
}

// Returns a date string for Epoch time in secs
function timeStr(epoch) {
  return new Date(epoch).toLocaleTimeString();
}

function epochTimeToHours(epochTime) {
  var elapsedHrs = Math.floor(epochTime/3600000);
  var elapsedMin = Math.floor(((epochTime/3600000) - elapsedHrs) * 60);
  return(elapsedHrs.toString() + ":" + elapsedMin.toString().padStart(2, '0'));
}

function makeLongArr(objArr) {
  var newArr = [];

  for (i=0; i<objArr.length; i++) 
    newArr.push(...[objArr[i].y[0], objArr[i].y[1]]);

  let min = Math.min(...newArr);
  let max = Math.max(...newArr);
  return({'min' : min,
           'max' : max});
}

// Find the broadest set of "begin" and "end" times for all Hypnos so we can see what they all 
// look like aligned on a common horizontal axis
function findExtents(jsonHypno) {
  var min = Date.now();     // A good start for max, since we'll always be looking at dates in the past
  var max = 0;
 // const padding = 720000;   // How much pre/post time padding we want around extents
  const padding = 600000;

  jsonHypno.forEach(function(el) {
    if (el.source != "Trued") {   // Ignore 'Trued' since it's in a different form
      var h = JSON.parse(el.hypno);
      min = Math.min(min, Math.min(...h.map(({x, y})=>{ return y[0];})));
      max = Math.max(max, Math.max(...h.map(({x, y})=>{ return y[1];})));
    }
  });
  const minimax = [min - padding, max + padding];
  console.log("Final Extents=[" + new Date(min).toLocaleString() + "," + new Date(max).toLocaleString() + "]");
  return minimax;
}

// Convert a sleepnet hypno into a hypno we can plot in a stepline chart
function marshallSleepNetHypno(hypno) { 
   const hypnoState = ["Catatonic","Deep", "Light", "REM", "Wake"];
   var newHypno = [];

   hypno.forEach((el, i) => {
     newHypno.push({x: el.y[0], y: hypnoState.indexOf(el.x)});
   });
   newHypno.sort((a, b) => {return a.x - b.x});  // sort the new array

   newHypno.forEach((el, i) => {el.x = new Date(el.x).toLocaleString()});    // now change from epoch secs to real dates

   // Finally, add a record onto the end that makes the Hypno work because the final element is there...
   newHypno.push({x: new Date(hypno[hypno.length-1].y[1]).toLocaleString(), y: hypnoState.indexOf(hypno[hypno.length-1].x)});
   console.log("NEW HYPNO =: " + JSON.stringify(newHypno));
   return(newHypno);
 }

 function marshallHealthkitRecords(hkType, sleepRec) {
  var newRecList = [];
  var newRec;

  if (sleepRec) {
    for (i=0; i< sleepRec.length; i++)
      if (sleepRec[i].recordtype == hkType) {
        // console.log("HR Rec=(" + new Date(sleepRec[i].startdate).toLocaleString() + "," + sleepRec[i].value + ")")
        newRec = new Object();
        newRec.x = new Date(sleepRec[i].startdate).toLocaleString();
        newRec.y = sleepRec[i].value;
        newRecList.push(newRec);
    }
 }
  return newRecList;
}

function xformAERecs(recList) {
  var newRecList = [];
  var newRec;

  for (i=0; i< recList.length; i++) {
    newRec = new Object();
    newRec.x = recList[i].x;
    newRec.y = recList[i].y;
    newRecList.push(newRec);
    newRec = new Object();
    newRec.x = recList[i].x;
    newRec.y = 0;
    newRecList.push(newRec);
  }
  return newRecList;
}

function marshallHealthkitSleepRecords(sleepRec, startTime, endTime) {
  //console.log("Marshalling Sleep Data:" + JSON.stringify(sleepRec));
  var fullInBedRecs = sleepRec.filter(el => (el.recordtype === 'HKCategoryValueSleepAnalysis' && el.value===1)); 
  var asleepRecs = sleepRec.filter(el => (el.recordtype === 'HKCategoryValueSleepAnalysis' && el.value!==1)); 

  console.log("FULL InBed Recs=" + JSON.stringify(fullInBedRecs));

//  var newinBedRecs = fullInBedRecs.map(({startdate, enddate}) => {return {x:startdate, y:enddate}});  //trim this array down to just the start and end date properties
  var newinBedRecs = [];
  // first create the initial "Awake" ... we always start/end with "Awake"


  newinBedRecs.push({x:new Date(startTime).toLocaleString(), y:5});
temp = new Date(fullInBedRecs.startdate).toLocaleString()
if (newinBedRecs[0].x < temp) console.log("WARNING:  InBed Records starts BEFORE Begin_Extents!!!");
  fullInBedRecs.forEach(val => { newinBedRecs.push({x: new Date(val.startdate).toLocaleString(), y: 4}); 
                                 newinBedRecs.push({x: new Date(val.enddate).toLocaleString(), y: 5}); 
                      });
  newinBedRecs.push({x:new Date(endTime).toLocaleString(), y:5});  // Add an "Awake" at the end for good measure
                    
  console.log("InBed Recs=" + JSON.stringify(newinBedRecs));
  console.log("Asleep Recs=" + JSON.stringify(asleepRecs));
  return [newinBedRecs, asleepRecs];
}

function renderHypnoData(source, divEl, sleepMeta, min, max) {
  var sleepArch = findSrc(sleepMeta, source);
  if (sleepArch) {
    console.log("==> HypnoStat UTC Offset(" + source + ")=" + sleepArch.utcoffset);

    console.log("Stats for " + source + "=[" + Math.round(sleepArch.score) + "/" + epochTimeToHours(sleepArch.timedeep) + "/" + epochTimeToHours(sleepArch.timerem) + "/" + epochTimeToHours(sleepArch.timeawake));
    return(CreateHypnoChart(divEl, source, min, max, sleepArch));
  } else {
console.log("NO HYPNO CHART, NO '" + source + "' Data");
    return null;
  } 
}



async function fetchWhack2Data(token, model, dayOffset) {
  var dsData = null;  
  console.log("fetchHypnoData()");

  const res = await fetch('https://sleepnet.appspot.com/api/newwhack2/' + model + '/' + dayOffset, {
      headers: {
      Authorization: 'Bearer ' + token
    }
  })
    .then (res => res.json())
    .then(dataBack =>  { 
       console.log("Fetching NewWhack2 Model=" + model + " Day=" + dayOffset + ": " + JSON.stringify(dataBack));
                          if (dataBack) {
                            dsData = dataBack;
                          }
                       });

    return(dsData);
}



async function fetchHypnoData(dayOffset, token) {
      var dsData = null;  
      console.log("fetchHypnoData()");
    
      const res = await fetch('https://sleepnet.appspot.com/api/hypnostats/' + dayOffset, {
    
          headers: {
          Authorization: 'Bearer ' + token
        }
      })
        .then (res => res.json())
        .then(dataBack =>  { 
   //       console.log("DEEPSLEEP HYPNOSTATS:" + JSON.stringify(dataBack));
                              if (dataBack) {
                                dsData = dataBack;
                              }
                           });
    
        return(dsData);
    }


    async function fetchHealthkitData(dayOffset, token) {
        var dsData = null;  
        console.log("fetchHealthkitData()");
      
        const res = await fetch('https://sleepnet.appspot.com/api/records/' + dayOffset, {
     
            headers: {
            Authorization: 'Bearer ' + token
          }
        })
          .then (res => res.json())
          .then(dataBack =>  { 
            console.log("HEALTHKIT RECORDS:" + JSON.stringify(dataBack));
                                if (dataBack) {
                                  dsData = dataBack;
                                }
                             });
      
          return(dsData);
      }
  
      
      
//===================  DATE MANIPULATION UTILITIES  ======================

function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

function formatDate(date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      // padTo2Digits(date.getSeconds()),  
    ].join(':')
  );
}


function difference(d1, d2) {  
  var date1 = new Date(d1);
  var date2 = new Date(d2);

//console.log("DIFF BETWEEN DATE1 and DATE2 is:" + date1.getDate() - date2.getDate());
  const date1utc = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const date2utc = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    day = 1000*60*60*24;
  return(date2utc - date1utc)/day
}

