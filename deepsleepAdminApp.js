//******************************************************************************************************
// GLOBALS
//******************************************************************************************************
const gChartDiv = "chart-area";
var gChartCount = 1;
var gCharts = [];

//******************************************************************************************************
// VUE APP
//******************************************************************************************************
const deepsleepAdminApp = new Vue({
  el: '#deepsleepAdminApp',
  mounted() {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.datePickerDate = yesterday.toISOString().split('T')[0];
    if (Cookies.Get('ds_auth')) {
      this.ds_auth = JSON.parse(Cookies.Get('ds_auth'));
    }
    if(this.ds_auth){
      this.prePopulateData();
    }
  },
  data() {
    return {
      // auth credentials
      ds_auth: {"result":"success","session":"f7ee6b17-80dd-4a7c-7103-251cd6fbc80f","user":{"id":3,"uuid":"da43585a-aa16-4756-62e3-193a10fcb25e","email":"will@silvernovus.com","role":{"Int32":1,"Valid":true},"createdat":"2021-05-27T19:11:55.526684Z","name":"Will Mitchell","password":"","resetpassword":{"String":"","Valid":false},"resetuuid":{"String":"","Valid":false},"resetexpiration":{"Time":"0001-01-01T00:00:00Z","Valid":false},"lasttouch":{"Time":"2024-02-26T22:23:10.449499Z","Valid":true}}},
      // Login stuff
      login_params: {
        data: {
          email: null,
          password: null
        },
        remember_me: false,
        show_password: false
      },
      login_error_msg: null,
      // vm for app
      alert: null,
      leaderboard: {
        Leaders: []
      },
      selectedUser: null,
      datePickerDate: '2022-02-12',
      chartArea: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      chartOptions:{
        dampened: false
      }
    };
  },
  methods: {
    // App
    async prePopulateData() {
      this.setStatusAlert('...Loading Customer Data...');
      const leaderboard = await this.fetchLeaderboard(Helpers.getDateOffset(this.datePickerDate));
      if (leaderboard) {
        this.leaderboard = leaderboard;
        if (!this.leaderboard.Leaders) {
          this.leaderboard.Leaders = [];
        }
        console.log(this.leaderboard.Leaders)
        this.setStatusAlert('Loaded ' + this.leaderboard.Leaders.length + " customers.");
      } else {
        this.setErrorAlert("Error:  No DeepSleep Users Found!");
      }
    },
    // HELPERS
    getRequestOptions(requestType) {
      var headers = new Headers();
      headers.append("Authorization", "Bearer " + this.selectedUser.sessions[0].uuid);
      return {
        method: requestType,
        headers: headers,
        redirect: 'follow'
      };
    },
    oldGetRequestOptions(requestType) {
      var headers = new Headers();
      console.log('AUTHORIZATION BEARER ', this.ds_auth.session)
      headers.append("Authorization", "Bearer " + this.ds_auth.session);
      return {
        method: requestType,
        headers: headers,
        redirect: 'follow'
      };
    },
    // MODS:
    async flattenMovement() {
        if(this.chartOptions.dampened){
          let dateDelta = Helpers.getDateOffset(this.datePickerDate);
          const hypnoMeta = await this.fetchHypnoData(dateDelta);
          // Only render *anything* if we actually got back *some* hypno data
          if (hypnoMeta) {
            // Show chart area
            var sleepDataEl = document.getElementById("sleep-data");
            console.log("Sleep Data DIV state='" + sleepDataEl.style.display + "'");
            sleepDataEl.style.display = "block";
      
            const extents = SynthUtils.findExtents(hypnoMeta, true);   
            var startExtent = extents[0];
            var endExtent = extents[1];
            if(this.chartOptions.dampened){
              var sleepArch = Helpers.findSrc(hypnoMeta, "Trued");
              var newHypno = SynthUtils.flattenStates(JSON.parse(sleepArch.hypno), 'Wake', 'REM');   // squash any short Wake states to REMs
              newHypno = SynthUtils.flattenStates(newHypno, 'REM', 'Light');       // squash any short REM states to Light
              sleepArch.hypno = JSON.stringify(newHypno);        // Repackage this up as a stringified part of sleep arch
              calcSleepStats(sleepArch);  // Now have to recalc sleep stats/KSIs
              let chartIndex = gChartDiv + gChartCount++;
              gCharts.push(addChart("Dampened", chartIndex, CreateHypnoChart(chartIndex, "Dampened Movement", startExtent, endExtent, sleepArch)));
            }
          } 
        }
        else{
          removeChart("Dampened");
        }
    },
    // HYPNO
    newShowSleep() {
      dateDelta = Helpers.getDateOffset(this.datePickerDate);
      this.mainProgram(dateDelta);
    },
    async changeDate(){
      await this.prePopulateData();
      if(this.leaderboard.Leaders && this.leaderboard.Leaders.length > 0){
        if(this.selectedUser){
          let matches = this.leaderboard.Leaders.filter(x=>{return x.user.id == this.selectedUser.user.id});
          if(matches && matches.length > 0){
            this.selectedUser = matches[0];
            console.log('SELECTED USER ', this.selectedUser)
            this.setStatusAlert("Loading data for " + this.selectedUser.user.name + '...')
            this.newShowSleep();
          }
          else{
            cleanUpAllCharts();
          }
        }
      }
      else{
        cleanUpAllCharts();
      }
      
    },
    async mainProgram(dateOffset) {
      // Try to grab the union of all Hypno data we have for the user
      const hypnoMeta = await this.fetchHypnoData(dateOffset);
      // Only render *anything* if we actually got back *some* hypno data
      if (hypnoMeta) {
        // We only have Healthkit data if there was an AppleWatch detected....but it could be "bad Applewatch data"....
        const heathKitRecs = await this.fetchHealthkitData(dateOffset);
        this.convertHypnoDataToLocal(hypnoMeta, heathKitRecs);
        this.setStatusAlert('Showing data for ' + this.selectedUser.user.name)
      }
    },
    convertHypnoDataToLocal(hypnoMeta, heathKitRecs){
      let localOffsetMins = new Date().getTimezoneOffset();
      if(hypnoMeta && hypnoMeta.length > 0){
        hypnoMeta.forEach(x=>{
          let datasetOffsetMins = x.utcoffset/60000;
          let offsetDeltaMins = localOffsetMins + datasetOffsetMins;
          let deltaOffsetMs = offsetDeltaMins * 60000;
          let hypno = JSON.parse(x.hypno);
          hypno.forEach(el=>{
            if(el.y){
              if(el.y[0]){
                el.y[0] += deltaOffsetMs;
              }
              if(el.y[1]){
                el.y[0] += deltaOffsetMs;
              }
            }
          });
          x.hypno = JSON.stringify(hypno);
        })
      }
      drawCharts(hypnoMeta, heathKitRecs);
    },
    // API CALLS
    async fetchLeaderboard(dateOffset) {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/admin/leaders/stat/window/Trued/sleep_efficiency/' + dateOffset + '/22/1/0/30', this.oldGetRequestOptions("GET"));
    },
    async fetchHealthkitData(dayOffset) {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/recordshour/' + dayOffset + "/22", this.getRequestOptions("GET"));
    },
    async fetchHypnoData(dayOffset) {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/hypnostats/' + dayOffset + "/22", this.getRequestOptions("GET"));
    },
    async fetchWhack2Data(model, dayOffset) {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/newwhack2/' + model + '/' + dayOffset, this.getRequestOptions("GET"));
    },
    // Alerts
    setStatusAlert(message) {
      this.alert = {
        message: message,
        color: "warning"
      };
    },
    setErrorAlert(message) {
      this.alert = {
        message: message,
        color: "danger"
      };
    },
    removeAlert() {
      this.alert = null;
    },
    // LOGIN/LOGOUT
    async login() {
      var headers = new Headers();
      headers.append("Content-Type", "application/json");
      var requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(this.login_params.data),
        redirect: 'follow'
      };
      let response = await Helpers.Fetch("https://sleepnet.appspot.com/api/login", requestOptions);
      if (response) {
        if (response.result != 'success') {
          this.login_error_msg = 'Login Failed: ' + response.message;
        } else {
          if (this.login_params.remember_me) {
            Cookies.Set("ds_auth", JSON.stringify(response));
          } else {
            Cookies.Erase("ds_auth");
          }
          this.ds_auth = response;
          console.log('LOGIN RESPONSE ', JSON.stringify(response))
          this.prePopulateData();
        }
      } else {
        this.login_error_msg = 'Login Failed: Internal Server Error'
      }
    },
    async logout() {
      const callback = () => {
        this.ds_auth = null;
        Cookies.Erase("_SleepNetSession");
        Cookies.Erase("ds_auth");
        location.reload();
      };
      let result = await Helpers.Fetch("https://sleepnet.appspot.com/api/logout", this.oldGetRequestOptions('DELETE'));
      callback(result);
    }
  },
  computed: {
    isAuthorized() {
      return this.ds_auth;
    },
    hasAlert() {
      return this.alert && this.alert.message && this.alert.color;
    }
  }
});

//******************************************************************************************************
// END APP - OTHER FUNCTIONS
//******************************************************************************************************

function drawCharts(hypnoMeta, heathKitRecs) {
  cleanUpAllCharts(); // Get ready to draw new hypnos and biometrics by erasing old stuff
  // so we find 2 sets of extents...the default that's *with* AppleWatch data and an 'altExtents' without
  const extents = SynthUtils.findExtents(hypnoMeta, true); //  don't know if AppleWatch data is good yet...
  const altExtents = SynthUtils.findExtents(hypnoMeta, true);
  console.log("DETERMINED: Extents=" + extents[0] + "--" + extents[1]);
  console.log("DETERMINED: AltExtents=" + altExtents[0] + "--" + altExtents[1]);
  var startExtent = extents[0];
  var endExtent = extents[1];
  let chartIndex;
  if (heathKitRecs) {
    const hrRecList = Helpers.marshallHealthkitRecords('HKQuantityTypeIdentifierHeartRate', heathKitRecs);
    const aeRecList = Helpers.marshallHealthkitRecords('HKQuantityTypeIdentifierActiveEnergyBurned', heathKitRecs);
    const xformedAErecList = SynthUtils.xformAERecs(aeRecList); // pads out the AE records so they can be used in a Stepped Line chart
    // See what our time range is for all records assuming AppleWatch data is good
    const inBedSleepDataLists = Helpers.marshallHealthkitSleepRecords(heathKitRecs, startExtent, endExtent);
    const inBedDataCount = (inBedSleepDataLists[0].length) / 2 - 1;
    const asleepDataCount = inBedSleepDataLists[1].length;

    // If we have valid AppleWatch data
    if (inBedDataCount && asleepDataCount) {

      // Only show AppleWatch data if we think we legitimately have some.   Determined by having non-zero InBed and Asleep records
      chartIndex = gChartDiv + gChartCount++;
      gCharts.push(addChart('Biometrics', chartIndex, CreateBioChart(chartIndex, 'Biometrics', startExtent, endExtent, hrRecList, xformedAErecList)));
      chartIndex = gChartDiv + gChartCount++;
      gCharts.push(addChart('', chartIndex, CreateSleepRecordsChart(chartIndex, '', startExtent, endExtent, inBedSleepDataLists[0], inBedSleepDataLists[1])));
      chartIndex = gChartDiv + gChartCount++;
      renderHypnoData("SleepSignal_Hypno", chartIndex, hypnoMeta, startExtent, endExtent);

    } 
    else {

      // Don't have valid AppleWatch Data so recalc extents data
      console.log("Excluding AppleWatch Data");
      startExtent = altExtents[0];
      endExtent = altExtents[1];
    }
  } else {
    startExtent = altExtents[0];
    endExtent = altExtents[1];
  }
  ["Oura", "Withings", "Fitbit", "Garmin", "Feel", "Trued"].forEach(src => {
    chartIndex = gChartDiv + gChartCount++;
    gCharts.push(addChart(src, chartIndex, renderHypnoData(src,chartIndex, hypnoMeta, startExtent, endExtent)));
  });
}

function cleanUpAllCharts() {
  console.log("CleanUpAllCharts with gChartCount =" + gChartCount);
  // Nuke any live charts because we're about to create more....
  gCharts.forEach(x => {
    if (x.chart) x.chart.destroy()
  });

  // Also nuke any elements "innerHTML"
  for (i = 1; i < gChartCount + 1; i++) {
    Helpers.removeChartByID("chart-area" + i);
  }
  gChartCount = 1;
  gCharts = [];
}

function addChart(src, chartId, chart){
  return {
    source: src,
    chartId: chartId,
    chart: chart
  }
}

function removeChart(source){
  let indexToRemove;
  for(var i = 0; i < gCharts.length; i++){
    if(gCharts[i].source == source && gCharts[i].chart){
      gCharts[i].chart.destroy();
      indexToRemove = i + 1;
      Helpers.removeChartByID(gCharts[i].chartId );
    }
  }
  gCharts = Helpers.removeItemByIndex(gCharts, indexToRemove);
  console.log("GCHARTS ", gCharts)
}
 
 

function renderHypnoData(source, divEl, sleepMeta, min, max) {
  const sleepArch = Helpers.findSrc(sleepMeta, source);
  if (sleepArch) {
    console.log(`==> HypnoStat UTC Offset(${source})=${sleepArch.utcoffset}`);
    console.log(`Stats for ${source}=[${Math.round(sleepArch.score)}/${Helpers.epochTimeToHours(sleepArch.timedeep)}/${Helpers.epochTimeToHours(sleepArch.timerem)}/${Helpers.epochTimeToHours(sleepArch.timeawake)}]`);
    return CreateHypnoChart(divEl, source, min, max, sleepArch);
  } else {
    console.log(`NO HYPNO CHART, NO '${source}' Data`);
    return null;
  }
}
 


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


// Walks through the Trued Hypno and adjusts the states based on the values of other hypnos
async function trueTrue() {
  console.log("TRUE TRUE MOVEMENT...");

  var truedCheckbox = document.getElementById("trued");
  if (gTruedCheckbox) {
    console.log("Flatten Checkbox already Checked!!!");
    truedCheckbox.checked = true;
  }
  else {
    gTruedCheckbox = true;
    const hypnoMeta = await fetchHypnoData(Helpers.getDateOffset(), getCurrentUserToken());
    // Only render *anything* if we actually got back *some* hypno data
    if (hypnoMeta) {
      // Show chart area
      var sleepDataEl = document.getElementById("sleep-data");
      console.log("Sleep Data DIV state='" + sleepDataEl.style.display + "'");
      sleepDataEl.style.display = "block";

      const extents = SynthUtils.findExtents(hypnoMeta, true);   
      var startExtent = extents[0];
      var endExtent = extents[1];

      var sleepArch = Helpers.findSrc(hypnoMeta, "Trued");
      
      var newHypno = SynthUtils.flattenStates(JSON.parse(sleepArch.hypno), 'Wake', 'REM');   // squash any short Wake states to REMs
      newHypno = SynthUtils.flattenStates(newHypno, 'REM', 'Light');       // squash any short REM states to Light
      sleepArch.hypno = JSON.stringify(newHypno);        // Repackage this up as a stringified part of sleep arch

      calcSleepStats(sleepArch);  // Now have to recalc sleep stats/KSIs

      let chartIndex = gChartDiv + gChartCount++;
      gCharts.push(addChart("True Trued", chartIndex, CreateHypnoChart(chartIndex, "True Trued", startExtent, endExtent, sleepArch)));
    }
    else
      console.log("ERROR: Cannot True True Chart...no Hypno data!!!");
  }  
}



// Flattens the movement data in the main sleep 


function calcSleepStats(sleepArch) {

  var h = JSON.parse(sleepArch.hypno);
  // Stuff some values into the rest of the Sleep Arch object
  sleepArch.score = 90;
  //   sleepArch.tst = 7 * (60 * 60 * 1000);
  sleepArch.tst = h[h.length-1].y[1] - h[0].y[0];
  sleepArch.timedeep = SynthUtils.CountStateTime("Deep", h);
  //   sleepArch.timedeep =1.2 * (60 * 60 * 1000);
  sleepArch.timerem = SynthUtils.CountStateTime("REM", h);
  sleepArch.timeawake = SynthUtils.CountStateTime("Wake", h);
}


// Top level request to synthesize a sleep model and display it as a Hypno Chart
async function synthSleep() {

  var resultsPanelEl = document.getElementById("sleep-data");  
  var synthedSleep = null;

  initializePage();
 // cleanUpAllCharts();

  lastSleepDiv = document.getElementById("lastSleep-amt");

  resultsPanelEl.style.display = "block";   
  lastSleepDiv.style.display = "block";

  // Synthesize a Sleep Architecture for 10 last night to 6:30 this morning for a 60 male
  const divEl = "1";
  const startTime = SynthUtils.LastNight(23, 0);
  const endTime = SynthUtils.ThisMorning(7, 0);

  sleepArch = SynthUtils.SynthHypno(startTime, endTime, 20);
  console.log("Synthesized Hypno = " + sleepArch.hypno);
  let chartIndex = gChartDiv + gChartCount++;
  gCharts.push(addChart("Synthesized", chartIndex, CreateHypnoChart(chartIndex, "Synthesized", startTime, endTime, sleepArch)));

  var newSleepArch, warpIndex, sleepState;
  return (newSleepArch);
}








