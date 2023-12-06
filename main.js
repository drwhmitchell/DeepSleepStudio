//  MAIN.JS - Main Javascript code for program

//AUTHORIZATION BEARER  9f606456-8994-4467-49c8-bb444c7cc0c2



// Main functions ---
// The idea is that we want to create charts that line-up for comparison purposes -- so figure out the extents first, and use them for all



// gCharts keeps track of the list of charts created so we can destroy them 

const gChartDiv = "chart-area";
var gDST = "";    // A global for the bearer token .....hack hack!!!
var gChartCount = 1;
var gCharts = []; 
var gViewingUTCOffset = moment().utcOffset();
var gIsAuthorized = false;    // start out unauthorized
//var gFlettenCheckbox = false;
const app = this;
var ds_auth;
if(getCookie('ds_auth')){
  ds_auth = JSON.parse(getCookie('ds_auth'));
}
console.log("DS AUTH COOKIE ", ds_auth)


// Preset the Date Picker to today's date
const [currentDate, currentTime] = formatDate(new Date()).split(' ');
const dateInput = document.getElementById('myDate');
dateInput.value = currentDate;
//const mt = "45a31d51-799e-4776-5ea7-b7cb540c701f";


// 1. create access token https://cloud.ouraring.com/docs/authentication#create-a-personal-access-token
// 2. use API 
var OURA_TOKEN = 'JRW4ID2RRFVOTQHN4C7MLIT2U2OCT3CR';
var date = '2023-10-23';
//findOuraData(OURA_TOKEN, date);


function logout(){
  fetch("https://sleepnet.appspot.com/api/logout", getRequestOptions('DELETE'))
    .then(result => {
      app.ds_auth = null;
      console.log("LOGOUT SUCCESS ", result);
      document.cookie = "_SleepNetSession=";
      document.cookie = "ds_auth=";
      location.reload();
    })
    .catch(error => {
      app.ds_auth = null;
      console.log('LOGOUT err', err)
      document.cookie = "_SleepNetSession=";
      document.cookie = "ds_auth=";
      location.reload();
    });

}
// On Page Load function
function initializePage() {
console.log("INITIALIZE PAGE()");  

  var controlPanelEl = document.getElementById("control-panel"); 
  var resultsPanelEl = document.getElementById("sleep-data");  
  var securityEl = document.getElementById("security");  
 // var flattenCheckbox = document.getElementById("flattened");
 // var truedCheckbox = document.getElementById("trued");

  // Reset flatten checkbox to whatever it should be
 // gFlattenCheckbox = false;
 // flattenCheckbox.checked = false;

//  gTruedCheckbox = false;
//  truedCheckbox = false;

  if(app.ds_auth){
    gIsAuthorized = true;
  }

  // If we are Authorized, display just the control panel
  if (gIsAuthorized) {
    controlPanelEl.style.display = "block";
    securityEl.style.display = "none";  // Hide login panel
    resultsPanelEl.style.display = "none";   // Hide results panel until we use control panel to generate some
    document.getElementById('currentUserBadge').innerHTML = 'Logged in as <b>' +  ds_auth.user.email + '</b>';
  } else {
    // We're not Authorized yet so just show the security panel and hide the rest
    securityEl.style.display = "block";
    controlPanelEl.style.display = "none";
    resultsPanelEl.style.display = "none";
  }
  
  if(gIsAuthorized){
   prePopulateData(getDateOffset());
//newShowSleep(ds_auth);
}
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}


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

function signIn() {
  console.log("sign in");
 let username = $('#username').val();
 let password = $('#password').val();
 let remember_me = $('#remember_me').is(':checked');
 var headers = new Headers();
 headers.append("Content-Type", "application/json");
 var raw = JSON.stringify({"email":username,"password":password});
 
 var requestOptions = {
   method: 'POST',
   headers: headers,
   body: raw,
   redirect: 'follow'
 };
 const loginErrorAlertId = 'loginErrAlert' ;
 document.getElementById(loginErrorAlertId).style.visibility = 'hidden';
 hideElement('loginErrAlert')
 let loginResponse;
 fetch("https://sleepnet.appspot.com/api/login", requestOptions)
   .then(response => {
      loginResponse = response;
      return response.json()
   })
   .then(result => {
      if(!loginResponse.ok){
        document.getElementById(loginErrorAlertId).style.visibility = 'visible';
        document.getElementById('loginErrMsg').innerHTML = 'Login Failed: ' + result.message;
      }
      else{
        if(remember_me){
          document.cookie = "ds_auth=" + JSON.stringify(result);
        }
        else{
         document.cookie = "ds_auth=";
        }
        app.ds_auth = result;
        initializePage();
      }
   })
   .catch(error => {
    document.getElementById(loginErrorAlertId).style.visibility = 'visible';
    document.getElementById('loginErrMsg').innerHTML = 'Login Failed: Internal Server Error';
   });
}

function hideElement(elementId){
  document.getElementById(elementId).style.visibility = 'hidden';
}

function changeElement(elementId, newText) {
  document.getElementById(elementId).innerText = newText;
}

function getCurrentUserToken() {
    // Grabs the currently selected user's token
    var userName = document.getElementById('user-select');
    console.log("getCurrentUserToken User Token =" + userName.value)
    return(userName.value);  
}

// Fetches the current Date Offset from the Date Picker
function getDateOffset() {
  const datePickerDate = document.getElementById('myDate').value;
  console.log("Date Picker Datet =" + datePickerDate);
  // Javascript's Date function is incredibly screwed up, so I need to get today's date in this bizzare way
  var today = new Date();
  var strToday =  today.getFullYear() + "-" + padTo2Digits(today.getMonth()+1) + "-" + padTo2Digits(today.getDate());
  // SleepNet's APIs all use 'date offsets' so I need to use this.
  var dateDelta = difference(datePickerDate, strToday);
// I think I handle errors right now so we don't need this..
  //  dateDelta = dateDelta > -1 ? dateDelta : 0;   // Default the sleep offset to 0 if something future picked on the date picker
  console.log("Date Offset =" + dateDelta);
  console.log("gUTCOffset = " + moment().utcOffset());
  console.log("Today UTC Offset = " + today.getTimezoneOffset());
  console.log("Date Time Offset would say DATE_OFFSET==" + dateDelta + " and TIME_OFFSET==" + today.getTimezoneOffset()/60);
  console.log("Total time perhaps longer than TODAY =" + Number(today.getHours() + today.getTimezoneOffset()/60));
  if ((today.getHours() + today.getTimezoneOffset()/60) < 24)
    return(dateDelta);
  else 
    return(dateDelta + 1);
}

async function findOuraData(token, date) {
  console.log("Entered FindOuraData()");
  var res = await fetch("https://api.ouraring.com/v1/activity?start="+date+"&end="+date+"&access_token="+token);
  var data = (await res.json()).activity;
  data = data.length ? data[0] : {};
 // console.log("Oura Res==" + JSON.stringify(res));
  console.log("Oura Data==" + JSON.stringify(data));
console.log("Met-1-min==" + JSON.stringify(data.met_1min));
}

// Find the all 4 models of a Whack2 for a certain date offset
async function findWhack2Models() {
  // First grab the current user token
  var userName = document.getElementById('user-select');
  console.log("Selected User Token =" + userName.value);
  gDST = userName.value;
  var day = 0;
  var hypnoMeta;

  // Now try each date offset starting with 0 until we hit a date with a sleep 
  for (i=0; i<4; i++) {
    hypnoMeta = await fetchWhack2Data(i, day);
    console.log('Whack2(' + i + ',' + day + ')=' + '' + JSON.stringify(hypnoMeta));
  }
}

/*
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
    const hypnoMeta = await fetchHypnoData(i);
    const heathKitRecs = await fetchHealthkitData(i);
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

*/

function newShowSleep(token) {
  dateDelta = getDateOffset();
//  initializePage();
  mainProgram(dateDelta);
}

function userSelection() {
  // Now grab the date offset
  dateDelta = getDateOffset();
    // Now grab the current user token
    var userName = document.getElementById('user-select');
    console.log("Selected User Token =" + userName.value)
    gDST = userName.value;

    mainProgram(dateDelta);
}


// Enter main program here....
function showSleep() {

  // Now grab the date offset
  dateDelta = getDateOffset();
  
  // Now grab the current user token
  var userName = document.getElementById('user-select');
  console.log("Selected User Token =" + userName.value)
  gDST = userName.value;

  initializePage();
  
  // User the Leaderboard API to populate the 'user-select' field
  prePopulateData(dateDelta); 

  mainProgram(dateDelta);
}


function refreshSleep() {
//  initializePage();
//  prePopulateData(getDateOffset());
//showSleep();
newShowSleep(ds_auth);
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




// Pre-populates the Users viewable based on Leaderboard APIs

async function prePopulateData(dateOffset) {

  var userPicker = document.getElementById('user-select');
  var option;

  // Remove any options if there are any already...
  userPicker.options.length = 0;
changeElement('status-alert', "...Loading Customer Data...");
  const leaderboard = await fetchLeaderboard(dateOffset);
  if (leaderboard) {
    for (let i = 0; i < leaderboard.Leaders.length; i++) {
      console.log("Leaderboard API for " + JSON.stringify(leaderboard.Leaders[i].user.name) + " is: " + JSON.stringify(leaderboard.Leaders[i].sessions[0].uuid));
 
      // add these to the dropdown for User Picks
      option = document.createElement("option");
      option.text = leaderboard.Leaders[i].user.name;
      option.value = leaderboard.Leaders[i].sessions[0].uuid;
      userPicker.add(option, userPicker[i+1]);
      console.log("The User Picker should be populated!!!");
    }

    changeElement('status-alert', "Loaded " + leaderboard.Leaders.length + " customers.");
    // Now show the first user 
 //   showSleep();
  }
  else {
    console.log("ERROR: User Picker could not be populated!!!");
    alert("Error:  No DeepSleep Users Found!");
  }
}


async function mainProgram(dateOffset) {
  // Try to grab the union of all Hypno data we have for the user
  const hypnoMeta = await fetchHypnoData(dateOffset);

  // Only render *anything* if we actually got back *some* hypno data
  if (hypnoMeta) {
    console.log("***>Successfully Fetched a Hypno from HypnoMeta()");
    cleanUpAllCharts();  // Get ready to draw new hypnos and biometrics by erasing old stuff

      // Show chart area
    var sleepDataEl = document.getElementById("sleep-data");
    console.log("Sleep Data DIV state='" + sleepDataEl.style.display + "'");
    sleepDataEl.style.display = "block";
  
    // We only have Healthkit data if there was an AppleWatch detected....but it could be "bad Applewatch data"....
    const heathKitRecs = await fetchHealthkitData(dateOffset);

    // so we find 2 sets of extents...the default that's *with* AppleWatch data and an 'altExtents' without
    const extents = findExtents(hypnoMeta, true);   //  don't know if AppleWatch data is good yet...
    const altExtents = findExtents(hypnoMeta, true);
  console.log("DETERMINED: Extents=" + extents[0] + "--" + extents[1]);
  console.log("DETERMINED: AltExtents=" + altExtents[0] + "--" + altExtents[1]);

    var startExtent = extents[0];
    var endExtent = extents[1];

    if (heathKitRecs) {

      const hrRecList = marshallHealthkitRecords('HKQuantityTypeIdentifierHeartRate', heathKitRecs);
      const aeRecList = marshallHealthkitRecords('HKQuantityTypeIdentifierActiveEnergyBurned', heathKitRecs);
      const xformedAErecList = xformAERecs(aeRecList);  // pads out the AE records so they can be used in a Stepped Line chart
      // See what our time range is for all records assuming AppleWatch data is good
      const inBedSleepDataLists = marshallHealthkitSleepRecords(heathKitRecs, startExtent, endExtent);
      const inBedDataCount = (inBedSleepDataLists[0].length)/2 - 1;
      const asleepDataCount = inBedSleepDataLists[1].length;

      // If we have valid AppleWatch data
      if (inBedDataCount && asleepDataCount) {

        // Only show AppleWatch data if we think we legitimately have some.   Determined by having non-zero InBed and Asleep records
        gCharts.push(CreateBioChart(gChartDiv + gChartCount++, 'Biometrics', startExtent, endExtent, hrRecList, xformedAErecList));
        gCharts.push(CreateSleepRecordsChart(gChartDiv + gChartCount++, '', startExtent, endExtent, inBedSleepDataLists[0], inBedSleepDataLists[1]));
        renderHypnoData("SleepSignal_Hypno", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent);

      }
      else {

        // Don't have valid AppleWatch Data so recalc extents data
        console.log("Excluding AppleWatch Data");
        startExtent = altExtents[0];
        endExtent = altExtents[1];
      }
    }
    else {
      startExtent = altExtents[0];
      endExtent = altExtents[1];
    }
    gCharts.push(renderHypnoData("Oura", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent));
    gCharts.push(renderHypnoData("Withings", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent));
    gCharts.push(renderHypnoData("Fitbit", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent));
    gCharts.push(renderHypnoData("Garmin", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent));
    gCharts.push(renderHypnoData("Feel", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent));
    gCharts.push(renderHypnoData("Trued", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent));
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
function findExtents(jsonHypno, isAppleWatchValid) {
  var min = Date.now();     // A good start for max, since we'll always be looking at dates in the past
  var max = 0;
 // const padding = 720000;   // How much pre/post time padding we want around extents
  const padding = 600000;
  var valids;

  jsonHypno.forEach(function(el) {
    valids = (el.source != "Trued");
    if (valids) {   // Ignore 'Trued' since it's in a different form
console.log("FIND_EXTENTS: " + el.source + "\n");
        var h = JSON.parse(el.hypno);
        min = Math.min(min, Math.min(...h.map(({x, y})=>{ return y[0];})));
        max = Math.max(max, Math.max(...h.map(({x, y})=>{ return y[1];})));
    }
  });
  const minimax = [min - padding, max + padding];
  console.log("FIND EXTENTS Final Extents=[" + new Date(min).toLocaleString() + "," + new Date(max).toLocaleString() + "]");
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



async function fetchWhack2Data( model, dayOffset) {
  var dsData = null;  
  console.log("fetchHypnoData()");

  const res = await fetch('https://sleepnet.appspot.com/api/newwhack2/' + model + '/' + dayOffset, getRequestOptions("GET"))
    .then (res => res.json())
    .then(dataBack =>  { 
       console.log("Fetching NewWhack2 Model=" + model + " Day=" + dayOffset + ": " + JSON.stringify(dataBack));
                          if (dataBack) {
                            dsData = dataBack;
                          }
                       });

    return(dsData);
}

const oldGetRequestOptions = (requestType) =>{
  var headers = new Headers();
    console.log('AUTHORIZATION BEARER ', app.ds_auth.session)
    headers.append("Authorization", "Bearer " + app.ds_auth.session);


  return {
    method: requestType,
    headers: headers,
    redirect: 'follow'
  };
}

const getRequestOptions = (requestType) =>{
  var headers = new Headers();
//  console.log('AUTHORIZATION BEARER ', app.ds_auth.session)
//  headers.append("Authorization", "Bearer " + app.ds_auth.session);
    console.log('AUTH BEARER:' + gDST);    // gDST is a global containing the current user's bearer token
    headers.append("Authorization", "Bearer " + gDST);

  return {
    method: requestType,
    headers: headers,
    redirect: 'follow'
  };
}

async function fetchLeaderboard(dateOffset) {
    var dsData = null;  
    const res =  await fetch('https://sleepnet.appspot.com/api/admin/leaders/stat/window/Trued/sleep_efficiency/' + dateOffset + '/22/1/0/30', oldGetRequestOptions("GET"))
    .catch(err => {console.log("Can't Fetch Leaderboard Data: " + err.response.data)})
    .then (res => res.json())
    .then(dataBack =>  { 
       console.log("Leaderboard:" + JSON.stringify(dataBack));
                          if (dataBack) {
                            dsData = dataBack;
                          }
                       });

    return(dsData);

}


async function fetchHypnoData(dayOffset) {
      var dsData = null;  
      console.log("fetchHypnoData()");
    
      const res = await fetch('https://sleepnet.appspot.com/api/hypnostats/' + dayOffset + "/22", getRequestOptions("GET"))
        .then (res => res.json())
        .then(dataBack =>  { 
   //       console.log("DEEPSLEEP HYPNOSTATS:" + JSON.stringify(dataBack));
                              if (dataBack) {
                                dsData = dataBack;
                              }
                           });
    
        return(dsData);
    }


    async function fetchHealthkitData(dayOffset) {
        var dsData = null;  
        console.log("fetchHealthkitData()");
      
        const res = await fetch('https://sleepnet.appspot.com/api/recordshour/' + dayOffset + "/22", getRequestOptions("GET"))
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

/*
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

  
var leaderboard = {
  Leaders: [
    {
      Leader: {
        username: "anonymous",
        rank: 1,
        time: 0.98790324,
        tst: 14700000,
        rem: 1380000,
        deep: 2220000,
        score: 38,
        efficiency: 0.98790324,
        hypnoid: 13488,
        userId: 120,
        notes: null,
        sources: [
          "AppleWatch"
        ],
        likescount: 0,
        commentcount: 0,
        consecutivecount: 61,
        comments: null,
        likedUserList: null
      },
      user: {
        id: 120,
        uuid: "ce34bb8e-39cc-4211-426d-26b69d293aa2",
        email: "mfoley@mwfoley.com",
        role: {
          Int32: 0,
          Valid: true
        },
        createdat: "2022-03-19T01:55:51.258326Z",
        name: "Mike Foley",
        password: "$2a$10$53rdZ0uYD8FFa6zW5g3GEuYV/X4Ca3Tj31vwAC6ae7yWG5VelVv0K",
        resetpassword: {
          String: "",
          Valid: false
        },
        resetuuid: {
          String: "",
          Valid: false
        },
        resetexpiration: {
          Time: "2022-03-19T02:05:51.43796Z",
          Valid: true
        },
        lasttouch: {
          Time: "2023-07-24T22:42:19.903152Z",
          Valid: true
        }
      },
      settings: {
        id: 69,
        userid: 120,
        accountprivacy: "Private",
        name: {
          String: "mfoley",
          Valid: true
        },
        sex: {
          String: "Male",
          Valid: true
        },
        sexprivacy: "Private",
        birthday: {
          Time: "1964-03-03T00:00:00Z",
          Valid: true
        },
        ageprivacy: "Private"
      },
      sessions: [
        {
          id: 3182,
          uuid: "79e6af69-5bef-4698-487f-d49ccd33dae9",
          email: "mfoley@mwfoley.com",
          role: {
            Int32: 0,
            Valid: true
          },
          createdat: "2022-04-28T22:54:18.106761Z",
          userid: 120
        },
        {
          id: 3181,
          uuid: "6d4bed9d-29a2-469c-4dfb-717bb04d8869",
          email: "mfoley@mwfoley.com",
          role: {
            Int32: 0,
            Valid: true
          },
          createdat: "2022-04-28T22:54:17.600919Z",
          userid: 120
        },
        {
          id: 2863,
          uuid: "311ea04a-3e64-4e45-4b15-554db9e4c026",
          email: "mfoley@mwfoley.com",
          role: {
            Int32: 0,
            Valid: true
          },
          createdat: "2022-04-18T20:00:59.065828Z",
          userid: 120
        }
      ]
    },
    {
      Leader: {
        username: "anonymous",
        rank: 1,
        time: 0.98790324,
        tst: 14700000,
        rem: 1380000,
        deep: 2220000,
        score: 38,
        efficiency: 0.98790324,
        hypnoid: 13488,
        userId: 120,
        notes: null,
        sources: [
          "AppleWatch"
        ],
        likescount: 0,
        commentcount: 0,
        consecutivecount: 61,
        comments: null,
        likedUserList: null
      },
      user: {
        id: 120,
        uuid: "ce34bb8e-39cc-4211-426d-26b69d293aa2",
        email: "mfoley@mwfoley.com",
        role: {
          Int32: 0,
          Valid: true
        },
        createdat: "2022-03-19T01:55:51.258326Z",
        name: "Mickey Mouse",
        password: "$2a$10$53rdZ0uYD8FFa6zW5g3GEuYV/X4Ca3Tj31vwAC6ae7yWG5VelVv0K",
        resetpassword: {
          String: "",
          Valid: false
        },
        resetuuid: {
          String: "",
          Valid: false
        },
        resetexpiration: {
          Time: "2022-03-19T02:05:51.43796Z",
          Valid: true
        },
        lasttouch: {
          Time: "2023-07-24T22:42:19.903152Z",
          Valid: true
        }
      },
      settings: {
        id: 69,
        userid: 120,
        accountprivacy: "Private",
        name: {
          String: "mfoley",
          Valid: true
        },
        sex: {
          String: "Male",
          Valid: true
        },
        sexprivacy: "Private",
        birthday: {
          Time: "1964-03-03T00:00:00Z",
          Valid: true
        },
        ageprivacy: "Private"
      },
      sessions: [
        {
          id: 3182,
          uuid: "79e6af69-5bef-4698-487f-d49ccd33dae9",
          email: "mfoley@mwfoley.com",
          role: {
            Int32: 0,
            Valid: true
          },
          createdat: "2022-04-28T22:54:18.106761Z",
          userid: 120
        },
        {
          id: 3181,
          uuid: "6d4bed9d-29a2-469c-4dfb-717bb04d8869",
          email: "mfoley@mwfoley.com",
          role: {
            Int32: 0,
            Valid: true
          },
          createdat: "2022-04-28T22:54:17.600919Z",
          userid: 120
        },
        {
          id: 2863,
          uuid: "311ea04a-3e64-4e45-4b15-554db9e4c026",
          email: "mfoley@mwfoley.com",
          role: {
            Int32: 0,
            Valid: true
          },
          createdat: "2022-04-18T20:00:59.065828Z",
          userid: 120
        }
      ]
    }
  ]
};
*/
