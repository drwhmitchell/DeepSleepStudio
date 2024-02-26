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
    if (getCookie('ds_auth')) {
      this.ds_auth = JSON.parse(getCookie('ds_auth'));
      this.prePopulateData();
    }
  },
  data() {
    return {
      // auth credentials
      ds_auth: null,
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
      chartArea: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };
  },
  methods: {
    // App
    async prePopulateData() {
      this.setStatusAlert('...Loading Customer Data...');
      const leaderboard = await this.fetchLeaderboard(getDateOffset(this.datePickerDate));
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
    // HYPNO
    newShowSleep() {
      dateDelta = getDateOffset(this.datePickerDate);
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
      return await makeApiCall('https://sleepnet.appspot.com/api/admin/leaders/stat/window/Trued/sleep_efficiency/' + dateOffset + '/22/1/0/30', this.oldGetRequestOptions("GET"));
    },
    async fetchHealthkitData(dayOffset) {
      return await makeApiCall('https://sleepnet.appspot.com/api/recordshour/' + dayOffset + "/22", this.getRequestOptions("GET"));
    },
    async fetchHypnoData(dayOffset) {
      return await makeApiCall('https://sleepnet.appspot.com/api/hypnostats/' + dayOffset + "/22", this.getRequestOptions("GET"));
    },
    async fetchWhack2Data(model, dayOffset) {
      return await makeApiCall('https://sleepnet.appspot.com/api/newwhack2/' + model + '/' + dayOffset, this.getRequestOptions("GET"));
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
      let response = await makeApiCall("https://sleepnet.appspot.com/api/login", requestOptions);
      if (response) {
        if (response.result != 'success') {
          this.login_error_msg = 'Login Failed: ' + response.message;
        } else {
          if (this.login_params.remember_me) {
            setCookie("ds_auth", JSON.stringify(response));
          } else {
            eraseCookie("ds_auth");
          }
          this.ds_auth = response;
          this.prePopulateData();
        }
      } else {
        this.login_error_msg = 'Login Failed: Internal Server Error'
      }
    },
    async logout() {
      const callback = () => {
        this.ds_auth = null;
        eraseCookie("_SleepNetSession");
        eraseCookie("ds_auth");
        location.reload();
      };
      let result = await makeApiCall("https://sleepnet.appspot.com/api/logout", this.oldGetRequestOptions('DELETE'));
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

async function makeApiCall(path, options) {
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

function getCookie(cookie_name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${cookie_name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

function eraseCookie(cookie_name) {
  document.cookie = cookie_name + '=';
};

function setCookie(cookie_name, data) {
  document.cookie = cookie_name + '=' + data;
};

function drawCharts(hypnoMeta, heathKitRecs) {
  cleanUpAllCharts(); // Get ready to draw new hypnos and biometrics by erasing old stuff
  // so we find 2 sets of extents...the default that's *with* AppleWatch data and an 'altExtents' without
  const extents = findExtents(hypnoMeta, true); //  don't know if AppleWatch data is good yet...
  const altExtents = findExtents(hypnoMeta, true);
  console.log("DETERMINED: Extents=" + extents[0] + "--" + extents[1]);
  console.log("DETERMINED: AltExtents=" + altExtents[0] + "--" + altExtents[1]);
  var startExtent = extents[0];
  var endExtent = extents[1];
  if (heathKitRecs) {
    const hrRecList = marshallHealthkitRecords('HKQuantityTypeIdentifierHeartRate', heathKitRecs);
    const aeRecList = marshallHealthkitRecords('HKQuantityTypeIdentifierActiveEnergyBurned', heathKitRecs);
    const xformedAErecList = xformAERecs(aeRecList); // pads out the AE records so they can be used in a Stepped Line chart
    // See what our time range is for all records assuming AppleWatch data is good
    const inBedSleepDataLists = marshallHealthkitSleepRecords(heathKitRecs, startExtent, endExtent);
    const inBedDataCount = (inBedSleepDataLists[0].length) / 2 - 1;
    const asleepDataCount = inBedSleepDataLists[1].length;

    // If we have valid AppleWatch data
    if (inBedDataCount && asleepDataCount) {

      // Only show AppleWatch data if we think we legitimately have some.   Determined by having non-zero InBed and Asleep records
      gCharts.push(CreateBioChart(gChartDiv + gChartCount++, 'Biometrics', startExtent, endExtent, hrRecList, xformedAErecList));
      gCharts.push(CreateSleepRecordsChart(gChartDiv + gChartCount++, '', startExtent, endExtent, inBedSleepDataLists[0], inBedSleepDataLists[1]));
      renderHypnoData("SleepSignal_Hypno", gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent);

    } else {

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
    gCharts.push(renderHypnoData(src, gChartDiv + gChartCount++, hypnoMeta, startExtent, endExtent));
  });
}

function cleanUpAllCharts() {
  console.log("CleanUpAllCharts with gChartCount =" + gChartCount);
  // Nuke any live charts because we're about to create more....
  gCharts.forEach(chart => {
    if (chart) chart.destroy()
  });

  var chartHTML;
  // Also nuke any elements "innerHTML"
  for (i = 1; i < gChartCount + 1; i++) {
    chartHTML = document.getElementById("chart-area" + i);
    console.log("Nuking InnnerHTML of Chart#" + i);
    chartHTML.innerHTML = "";
  }
  gChartCount = 1;
  gCharts = [];
}

function getDateOffset(date) {
  const padTo2Digits = (num) => {
    return num.toString().padStart(2, '0');
  }
  const difference = (d1, d2) => {
    var date1 = new Date(d1);
    var date2 = new Date(d2);

    const date1utc = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const date2utc = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    day = 1000 * 60 * 60 * 24;
    return (date2utc - date1utc) / day
  }
  // Javascript's Date function is incredibly screwed up, so I need to get today's date in this bizzare way
  var today = new Date();
  var strToday = today.getFullYear() + "-" + padTo2Digits(today.getMonth() + 1) + "-" + padTo2Digits(today.getDate());
  // SleepNet's APIs all use 'date offsets' so I need to use this.
  var dateDelta = difference(date, strToday);
  // console.log("Date Offset =" + dateDelta);
  // console.log("gUTCOffset = " + moment().utcOffset());
  // console.log("Today UTC Offset = " + today.getTimezoneOffset());
  // console.log("Date Time Offset would say DATE_OFFSET==" + dateDelta + " and TIME_OFFSET==" + today.getTimezoneOffset() / 60);
  // console.log("Total time perhaps longer than TODAY =" + Number(today.getHours() + today.getTimezoneOffset() / 60));
  if ((today.getHours() + today.getTimezoneOffset() / 60) < 24)
    return (dateDelta);
  else
    return (dateDelta + 1);
}

function dateToLocalString(date){
  let result = new Date(date);
  return result;
}

function marshallSleepNetHypno(hypno) {
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
    el.x = dateToLocalString(el.x);
  }); // now change from epoch secs to real dates

  // Finally, add a record onto the end that makes the Hypno work because the final element is there...
  newHypno.push({
    x: dateToLocalString(hypno[hypno.length - 1].y[1]),
    y: hypnoState.indexOf(hypno[hypno.length - 1].x)
  });
  return (newHypno);
}

function epochTimeToHours(epochTime) {
  var elapsedHrs = Math.floor(epochTime / 3600000);
  var elapsedMin = Math.floor(((epochTime / 3600000) - elapsedHrs) * 60);
  return (elapsedHrs.toString() + ":" + elapsedMin.toString().padStart(2, '0'));
}
function findSrc(hypnoStats, src) {
  return hypnoStats.find(obj => obj.source === src);
}

function renderHypnoData(source, divEl, sleepMeta, min, max) {
  const sleepArch = findSrc(sleepMeta, source);
  if (sleepArch) {
    console.log(`==> HypnoStat UTC Offset(${source})=${sleepArch.utcoffset}`);
    console.log(`Stats for ${source}=[${Math.round(sleepArch.score)}/${epochTimeToHours(sleepArch.timedeep)}/${epochTimeToHours(sleepArch.timerem)}/${epochTimeToHours(sleepArch.timeawake)}]`);
    return CreateHypnoChart(divEl, source, min, max, sleepArch);
  } else {
    console.log(`NO HYPNO CHART, NO '${source}' Data`);
    return null;
  }
}

function marshallHealthkitRecords(hkType, sleepRec) {
  const newRecList = [];
  
  if (sleepRec) {
    for (const rec of sleepRec) {
      if (rec.recordtype === hkType) {
        const newRec = {
          x: dateToLocalString(rec.startdate),
          y: rec.value
        };
        newRecList.push(newRec);
      }
    }
  }
  return newRecList;
}

function marshallHealthkitSleepRecords(sleepRec, startTime, endTime) {
  const fullInBedRecs = sleepRec.filter(el => el.recordtype === 'HKCategoryValueSleepAnalysis' && el.value === 1);
  const asleepRecs = sleepRec.filter(el => el.recordtype === 'HKCategoryValueSleepAnalysis' && el.value !== 1);
  const newinBedRecs = [{ x: dateToLocalString(startTime), y: 5 }];

  fullInBedRecs.forEach(val => {
    newinBedRecs.push({ x: dateToLocalString(val.startdate), y: 4 });
    newinBedRecs.push({ x: dateToLocalString(val.enddate), y: 5 });
  });

  newinBedRecs.push({ x: dateToLocalString(endTime), y: 5 });
  console.log(`InBed Recs=${JSON.stringify(newinBedRecs)}`);
  console.log(`Asleep Recs=${JSON.stringify(asleepRecs)}`);
  return [newinBedRecs, asleepRecs];
}

function xformAERecs(recList) {
  const newRecList = [];

  for (const rec of recList) {
    newRecList.push({ x: rec.x, y: rec.y });
    newRecList.push({ x: rec.x, y: 0 });
  }
  return newRecList;
}

function findExtents(jsonHypno, isAppleWatchValid) {

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
  const minimax = [min - padding, max + padding];
  console.log(`FIND EXTENTS Final Extents=[${dateToLocalString(min)}, ${ dateToLocalString(max)}]`);
  return minimax;
}
