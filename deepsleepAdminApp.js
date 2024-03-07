//******************************************************************************************************
// VUE APP
//******************************************************************************************************
const deepsleepAdminApp = new Vue({
  el: '#deepsleepAdminApp',
  components:{
    HypnoChart,
    BioChart,
    RecordsChart
  },
  mounted() {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.datePickerDate = yesterday.toISOString().split('T')[0];
    if (Cookies.Get('ds_auth')) {
      this.ds_auth = JSON.parse(Cookies.Get('ds_auth'));
    }
    if(this.ds_auth){
      this.setLeaderboard();
    }
  },
  data() {
    return {
      // auth credentials
      ds_auth: null,
      ds_auth: {"result":"success","session":"12e80912-950f-4e52-7f8e-9bc403b7cdea","user":{"id":3,"uuid":"da43585a-aa16-4756-62e3-193a10fcb25e","email":"will@silvernovus.com","role":{"Int32":1,"Valid":true},"createdat":"2021-05-27T19:11:55.526684Z","name":"Will Mitchell","password":"","resetpassword":{"String":"","Valid":false},"resetuuid":{"String":"","Valid":false},"resetexpiration":{"Time":"0001-01-01T00:00:00Z","Valid":false},"lasttouch":{"Time":"2024-03-05T21:48:03.331513Z","Valid":true}}},
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
        dampened: false,
        trued: false,
        synthesized: false
      },
      flattenStatesAmount:5,
      charts: []
    };
  },
  methods: {
    // App
    async setLeaderboard() {
      this.setStatusAlert('...Loading Customer Data...');
      const leaderboard = await this.fetchLeaderboard();
      if (leaderboard) {
        this.leaderboard = leaderboard;
        if (!this.leaderboard.Leaders) {
          this.leaderboard.Leaders = [];
        }
        console.log(JSON.stringify(this.leaderboard.Leaders))
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
      // console.log('AUTHORIZATION BEARER ', this.ds_auth.session)
      headers.append("Authorization", "Bearer " + this.ds_auth.session);
      return {
        method: requestType,
        headers: headers,
        redirect: 'follow'
      };
    },
    // MODS:
    addHypnoChart(name, extents, sleepArch){
      this.charts.push({
        chartName: name,
        sleepExtents: extents,
        sleepArch: sleepArch,
        chartType: 'hypno'
      });
    },
    addBioChart(name, extents, hrData, aeData){
      this.charts.push({
        chartName: name,
        sleepExtents: extents,
        hrData: hrData,
        aeData: aeData,
        chartType: 'bio'
      })
    },
    addRecordsChart(name, extents,inBedData, asleepData){
      this.charts.push({
        chartName: name, 
        sleepExtents: extents,
        inBedData: inBedData,
        asleepData: asleepData,
        chartType: 'sleep-records'
      })
    },
    removeChart(name){
      this.charts = this.charts.filter(x=>{
        return x.chartName != name;
      });
    },
    async flattenMovement() {
        if(this.chartOptions.dampened){
          const hypnoMeta = await this.fetchHypnoData();
          // Only render *anything* if we actually got back *some* hypno data
          if (hypnoMeta) {
            const extents = SynthUtils.findExtents(hypnoMeta, true);   
            if(this.chartOptions.dampened){
              var sleepArch = Helpers.findSrc(hypnoMeta, "Trued");
              // var newHypno = SynthUtils.flattenStates(JSON.parse(sleepArch.hypno), 'Wake', 'REM');   // squash any short Wake states to REMs
              // newHypno = SynthUtils.flattenStates(newHypno, 'REM', 'Light');       // squash any short REM states to Light
              var newHypno = SynthUtils.newFlattenStates(JSON.parse(sleepArch.hypno), this.flattenStatesAmount);
              sleepArch.hypno = JSON.stringify(newHypno);        // Repackage this up as a stringified part of sleep arch
              calcSleepStats(sleepArch);  // Now have to recalc sleep stats/KSIs
              this.addHypnoChart("Dampened Movement", extents, sleepArch);
            }
          } 
        }
        else{
          this.removeChart("Dampened Movement");
        }
    },
    // Walks through the Trued Hypno and adjusts the states based on the values of other hypnos
    async trueTrue() {
      if(this.chartOptions.trued) {
        const hypnoMeta = await this.fetchHypnoData();
        // Only render *anything* if we actually got back *some* hypno data
        if (hypnoMeta) {
          const extents = SynthUtils.findExtents(hypnoMeta, true);   
          var sleepArch = Helpers.findSrc(hypnoMeta, "Trued");
          // var newHypno = SynthUtils.flattenStates(JSON.parse(sleepArch.hypno), 'Wake', 'REM');   // squash any short Wake states to REMs
          // newHypno = SynthUtils.flattenStates(newHypno, 'REM', 'Light');       // squash any short REM states to Light
          var newHypno = SynthUtils.newFlattenStates(JSON.parse(sleepArch.hypno), this.flattenStatesAmount)
          sleepArch.hypno = JSON.stringify(newHypno);        // Repackage this up as a stringified part of sleep arch
          calcSleepStats(sleepArch);  // Now have to recalc sleep stats/KSIs
          this.addHypnoChart("True Trued", extents, sleepArch);

        }
      }
      else{
        this.removeChart("True Trued");
      }  
    },
    async synthSleep() {
      if(this.chartOptions.synthesized){
        // Synthesize a Sleep Architecture for 10 last night to 6:30 this morning for a 60 male
        let extents = {
          start: SynthUtils.LastNight(23, 0),
          end: SynthUtils.ThisMorning(7, 0)
        }
        sleepArch = SynthUtils.SynthHypno(startTime, endTime, 20);
        this.addHypnoChart("Synthesized", extents, sleepArch);
      }
      else{
        this.removeChart("Synthesized");
      }
    },
    // HYPNO
    refreshUser() {
      this.getUserData();
      this.charts = [];
      this.chartOptions.dampened = false;
      this.chartOptions.trued = false;
      this.chartOptions.synthesized = false;
    },
    async changeDate(){
      await this.setLeaderboard();
      if(this.leaderboard.Leaders && this.leaderboard.Leaders.length > 0){
        if(this.selectedUser){
          let matches = this.leaderboard.Leaders.filter(x=>{return x.user.id == this.selectedUser.user.id});
          if(matches && matches.length > 0){
            this.selectedUser = matches[0];
            console.log('SELECTED USER ', this.selectedUser)
            this.setStatusAlert("Loading data for " + this.selectedUser.user.name + '...')
            this.refreshUser();
          }
          else{
            this.charts = [];
          }
        }
      }
      else{
        this.charts = []
      }
      
    },
    async getUserData() {
      // Try to grab the union of all Hypno data we have for the user
      const hypnoMeta = await this.fetchHypnoData();
      // Only render *anything* if we actually got back *some* hypno data
      if (hypnoMeta) {
        // We only have Healthkit data if there was an AppleWatch detected....but it could be "bad Applewatch data"....
        const heathKitRecs = await this.fetchHealthkitData();
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
      this.drawCharts(hypnoMeta, heathKitRecs);
    },
    drawCharts(hypnoMeta, heathKitRecs){
      this.charts = []; // Get ready to draw new hypnos and biometrics by erasing old stuff
      // so we find 2 sets of extents...the default that's *with* AppleWatch data and an 'altExtents' without
      let extents = SynthUtils.findExtents(hypnoMeta, true); //  don't know if AppleWatch data is good yet...
      let allExtents = SynthUtils.findExtents(hypnoMeta, false)
      if (heathKitRecs) {
        const hrRecList = Helpers.marshallHealthkitRecords('HKQuantityTypeIdentifierHeartRate', heathKitRecs);
        const aeRecList = Helpers.marshallHealthkitRecords('HKQuantityTypeIdentifierActiveEnergyBurned', heathKitRecs);
        const xformedAErecList = SynthUtils.xformAERecs(aeRecList); // pads out the AE records so they can be used in a Stepped Line chart
        // See what our time range is for all records assuming AppleWatch data is good
        const inBedSleepDataLists = Helpers.marshallHealthkitSleepRecords(heathKitRecs, extents.start, extents.end);
        const inBedDataCount = (inBedSleepDataLists[0].length) / 2 - 1;
        const asleepDataCount = inBedSleepDataLists[1].length;
    
        // If we have valid AppleWatch data
        if (inBedDataCount && asleepDataCount) {
    
          // Only show AppleWatch data if we think we legitimately have some.   Determined by having non-zero InBed and Asleep records
          this.addBioChart("Biometrics", extents,  hrRecList, xformedAErecList);
          this.addRecordsChart('HK RECORDS', extents, inBedSleepDataLists[0], inBedSleepDataLists[1]);
          this.adChartFromHypnoMeta("SleepSignal_Hypno", hypnoMeta, extents)
        } 
        else {
          // Don't have valid AppleWatch Data so recalc extents data
          console.log("Excluding AppleWatch Data");
          extents = allExtents;
        }
      } 
      else {
        extents = allExtents
      }
      ["Oura", "Withings", "Fitbit", "Garmin", "Feel", "Trued"].forEach(src => {
        this.adChartFromHypnoMeta(src, hypnoMeta, extents);
      });
    },
    adChartFromHypnoMeta(source, sleepMeta, extents){
      const sleepArch = Helpers.findSrc(sleepMeta, source);
      if (sleepArch) {
        console.log(`==> HypnoStat UTC Offset(${source})=${sleepArch.utcoffset}`);
        console.log(`Stats for ${source}=[${Math.round(sleepArch.score)}/${Helpers.epochTimeToHours(sleepArch.timedeep)}/${Helpers.epochTimeToHours(sleepArch.timerem)}/${Helpers.epochTimeToHours(sleepArch.timeawake)}]`);
        this.addHypnoChart(source, extents, sleepArch)
      } 
      else {
        console.log(`NO HYPNO CHART, NO '${source}' Data`);
      }
    },
    // API CALLS
    async fetchLeaderboard() {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/admin/leaders/stat/window/Trued/sleep_efficiency/' + Helpers.getDateOffset(this.datePickerDate) + '/22/1/0/30', this.oldGetRequestOptions("GET"));
    },
    async fetchHealthkitData() {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/recordshour/' + Helpers.getDateOffset(this.datePickerDate) + "/22", this.getRequestOptions("GET"));
    },
    async fetchHypnoData() {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/hypnostats/' + Helpers.getDateOffset(this.datePickerDate) + "/22", this.getRequestOptions("GET"));
    },
    async fetchWhack2Data(model) {
      return await Helpers.Fetch('https://sleepnet.appspot.com/api/newwhack2/' + model + '/' + Helpers.getDateOffset(this.datePickerDate), this.getRequestOptions("GET"));
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
          } 
          else {
            Cookies.Erase("ds_auth");
          }
          this.ds_auth = response;
          console.log('LOGIN RESPONSE ', JSON.stringify(response))
          this.setLeaderboard();
        }
      } 
      else {
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







