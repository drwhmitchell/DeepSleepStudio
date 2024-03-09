const SleepStages = Object.freeze({
  WAKE: 4,
  REM: 3,
  LIGHT:2,
  DEEP: 1
});



const HypnoChart = Vue.component('hypno-chart', {
  data() {
    return {
      chartData: [],
      rangeDivs: [],
      statsList: null,
      hypnoChart: null,
      selectedStage: null,
      selectedStageIndex: null,
      sleepStageDivs: [
        SleepStages.WAKE,
        SleepStages.REM,
        SleepStages.LIGHT,
        SleepStages.DEEP
      ]
    }
  },
  props:{
    chart: null,
    index: null
  },
  mounted(){
    if(this.chart && this.chart.sleepArch){
      this.chartData = SynthUtils.marshallSleepNetHypno(JSON.parse(this.chart.sleepArch.hypno));
      console.log("CHART DATA ", JSON.stringify(this.chartData));
      this.createHypnoChart();
      this.calcHypnoStats();
      this.createHypnoRange();
    }
  },
  methods: {
    calcHypnoStats(){
      var h = JSON.parse(this.chart.sleepArch.hypno);
      this.statsList = [{
        score: this.chart.sleepArch.score,
        tst: Helpers.epochTimeToHours(this.chart.sleepArch.tst),
        deep: Helpers.epochTimeToHours(SynthUtils.CountStateTime("Deep", h)),
        rem: Helpers.epochTimeToHours(SynthUtils.CountStateTime("REM", h)),
        awake: Helpers.epochTimeToHours(SynthUtils.CountStateTime("Wake", h)),
        tstRecalculated: Helpers.epochTimeToHours(h[h.length-1].y[1] - h[0].y[0]),
        deepRecalculated: Helpers.epochTimeToHours(this.chart.sleepArch.timedeep),
        remRecalculated: Helpers.epochTimeToHours(this.chart.sleepArch.timerem),
        awakeRecalculated: Helpers.epochTimeToHours(this.chart.sleepArch.timeawake)
      }]
    },
    createHypnoRange(){
      let rangeContainer = document.getElementById('hypno-range' + this.index);
      let rangeWidth = rangeContainer.offsetWidth;
      this.rangeDivs = [];
      if(this.chartData && this.chartData.length > 0){
        let sleepStart = new Date(this.chartData[0].x).getTime();
        let sleepEnd = new Date(this.chartData[this.chartData.length - 1].x).getTime();
        let timeBetween = sleepStart - sleepEnd;
        for(var i = 0; i < this.chartData.length - 1; i++){
          this.rangeDivs.push({
            width: rangeWidth * (  (new Date(this.chartData[i].x).getTime() - new Date(this.chartData[i + 1].x).getTime())/timeBetween ),
            color: this.getColorFromState(this.chartData[i].y),
            startTime: new Date(this.chartData[i].x).getTime(),
            endTime: new Date(this.chartData[i + 1].x).getTime(),
            startTimeLabel: new Date(this.chartData[i].x).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            endTimeLabel: new Date(this.chartData[i + 1].x).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            state: this.getStateFromNum(this.chartData[i].y),
            duration: Math.round((new Date(this.chartData[i + 1].x).getTime() - new Date(this.chartData[i].x).getTime())/60/1000),
            stateNum:this.chartData[i].y,
            nextStateNum: this.chartData[i + 1].y
          });
        }
      }
    },
    editStage(divIndex){
      console.log("RANGE ITEM CLICKED", this.rangeDivs[divIndex]);
      if(this.selectedStage == this.rangeDivs[divIndex]){
        this.cancelEditStage();
      }
      else{
        this.selectedStageIndex = divIndex;
        this.selectedStage = JSON.parse(JSON.stringify(this.rangeDivs[divIndex])); // deep clone if editing
      }
    },
    cancelEditStage(){
      this.selectedStageIndex = null;
      this.selectedStage = null
    },
    saveStageEdits(){
      if(this.rangeDivs[this.selectedStageIndex].state == this.selectedStage.stage 
        && this.rangeDivs[this.selectedStageIndex].duration == this.selectedStage.duration){
          this.cancelEditStage(); /// DO NOTHING, nothing changed. Don't update because duration for time is in minutes - not as accurate as actual time in DB.
      }
      else{
        this.rangeDivs[this.selectedStageIndex] = this.selectedStage;
        saveHypno();
        this.cancelEditStage();
        // Prop message to parent to save hypno. 
      }
    },
    updateChart(){
      var dataset = this.hypnoChart.data.datasets[0];
      var point = dataset.data[divIndex];
  
      // Trigger click event through the onClick handler
      this.hypnoChart.options.onClick.call(this.hypnoChart, {'dataIndex': divIndex}, [{datasetIndex: 0, index: divIndex, element: point}]);
      
    },
    saveHypno(){
      // TODO!! Save hypno based off edits for range divs (stages) -- or start/end slider (todo)
    },
    getColorFromState(stateNum){
      switch(stateNum){
        case SleepStages.WAKE:
        default:
          return '#B1ADA7';
        case SleepStages.REM:
          return '#00AAFF'
        case SleepStages.LIGHT: 
          return '#2f78bf';
        case SleepStages.DEEP:
          return '#004099';
      }
    },
    getStateFromNum(stateNum){
      switch(stateNum){
        case SleepStages.WAKE:
        default:
          return 'Wake';
        case SleepStages.REM:
          return 'REM'
        case SleepStages.LIGHT: 
          return 'Light';
        case SleepStages.DEEP:
          return 'Deep';
      }
    },
    // CHART CREATORS 
    createHypnoChart(){
      var ctx = document.getElementById('hypno-chart' + this.index).getContext('2d');
      this.hypnoChart = new Chart(ctx, {
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
                data : this.chartData
              }],
          },
          options: {
            layout: {
              padding: {
                  right: 86,
                  left: 0,
              }
            },
            
            onClick: (e)=>{
                console.log("GOT CLICK ITEM " , e)
    //               const canvasPosition = Chart.helpers.getRelativePosition(e, this.hypnoChart);
      
    //               // Substitute the appropriate scale IDs
    //               const timeX = this.hypnoChart.scales.x.getValueForPixel(canvasPosition.x);
    //               const stateY = this.hypnoChart.scales.SleepState.getValueForPixel(canvasPosition.SleepState);
    
    // //              var activePoint = hypnoChart.getElementAtEvent('onClick');
    // //              var selectedPoint = activePoint[0];
    // //              selectedPoint.custom = this.selectedPoint.custom || {};
    // //              selectedPoint.custom.backgroundColor = 'rgba(128,128,128,1)';
    // //              selectedPoint.custom.radius = 7;              
                  
    //               console.log("Got Click Event at X=" + timeX);
    //               console.log("Time=" + new Date(timeX).toLocaleTimeString() + " State=" + JSON.stringify(stateY));
            },
    
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend : {
                display: false,
              },
              title: {
                display: true,
                text: this.chart.chartName,
                font : { size: 18},
              }
            },
            scales: {
              x: {
                min: this.chart.sleepExtents.start,
                max: this.chart.sleepExtents.end,
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
                      case SleepStages.DEEP:
                        return 'DEEP';
                      case SleepStages.LIGHT:
                        return 'LIGHT';
                       case SleepStages.REM:
                        return 'REM';
                      case SleepStages.WAKE:
                        return 'WAKE';
                    }
                  }
                }
              }
            }
          }
      })
    }
  },
  computed: {
    getBorderColor() {
      return function(item, divState) {
        if(item.stateNum == divState){
          return `linear-gradient(to bottom, ${item.color} 10px, transparent 10px)`
        }
        else{
          return 'transparent';
        }
      }
    },
    getOuterSideBorder() {
      return function(item, divState) {
        let borderSizeType = '3px solid ';
        if(item.nextStateNum > item.stateNum){
          return (divState <= item.nextStateNum) && (divState > item.stateNum)
          ? borderSizeType + item.color
          : 'transparent'
        }
        else{
          return (divState > item.nextStateNum) && (divState <= item.stateNum)
          ? borderSizeType + item.color
          : 'none'
        }
      }
    },
    getInnerSideBorder(){
      return function(item,divState){
        let borderSizeType = '3px solid ';
      if((item.nextStateNum == divState) && divState < item.stateNum){
        return borderSizeType + item.color;
      }
      else{
          return 'none';
        }
      }
    }
  },
  template: `
  <div>
    <div class="sleep_record_container" style="height:300px;">
      <canvas style="height:300px" v-bind:id="'hypno-chart' + index"></canvas>
    </div>
    <div v-if="statsList" class="text-center">
      <div v-for="(stats, statIndex) in statsList" :key="statIndex" class="text-center" style="background-color: #F5F4F8">
        <small>
          SCORE {{ Math.round(stats.score) }}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          TST {{ stats.tst }} hours
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          DEEP {{ stats.deep }} hours
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          REM {{ stats.rem }} hours
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          AWAKE {{ stats.awake }} hours (Reported)
        </small><br>
        <small>
          SCORE {{ Math.round(stats.score) }}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          TST {{ stats.tstRecalculated }} hours
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          DEEP {{ stats.deepRecalculated }} hours
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          REM {{ stats.remRecalculated }} hours
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          AWAKE {{ stats.awakeRecalculated }} hours (Calculated)
        </small>
      </div>
    </div>


    <div class="hypno-stages-container">

      <div v-bind:id="'hypno-range' + index" class="hypno-range-container">
        <div v-for="(item, divIndex) in rangeDivs" class="hypno-stage" :style="{'width':item.width + 'px'}" v-on:click="editStage(divIndex)">
          <div v-for="(state, stateIndex) in sleepStageDivs" :class="{'stage-selected':divIndex == selectedStageIndex }" :style="{'background': getBorderColor(item, state), 'border-right': getOuterSideBorder(item, state) }">
            <div :style="{'border-right': getInnerSideBorder(item, state) }"></div>
          </div>
        </div>
      </div>

      <div v-if="selectedStage" class="edit-stage-container">
        <h5><b>EDIT STAGE</b></h5>
        
        <div>
          <div>
          <div>Stage:</div>
            <div>Duration:</div>
            <div>Started:</div>
            <div>Ended:</div>
            <div>
              <button class="btn btn-txt" v-on:click="cancelEditStage()">Cancel</button>
            </div>
          </div>
          <div>
            <div>
              <select class="form-control" v-model="selectedStage.state">
                <option>Light</option>
                <option>Deep</option>
                <option>REM</option>
                <option>Wake</option>
              </select>
            </div>
            <div>
              <input class="form-control" min="0" type="number" v-model="selectedStage.duration"/> <span style="padding-left:5px">mins</span>
            </div>
            <div>{{selectedStage.startTimeLabel}}</div>
            <div>{{selectedStage.endTimeLabel}} </div>
            <div style="width:100%; justify-content:flex-end">
              <button class="btn btn-success" v-on:click="saveStageEdits()">Save</button>
            </div>
          </div>
        </div>

      </div>


    </div>
    
  </div>
  `
})