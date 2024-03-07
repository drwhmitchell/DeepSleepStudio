const HypnoChart = Vue.component('hypno-chart', {
  data() {
    return {
      chartData: [],
      statsList: null
    }
  },
  props:{
    chart: null,
    index: null
  },
  mounted(){
    if(this.chart && this.chart.sleepArch){
      this.chartData = SynthUtils.marshallSleepNetHypno(JSON.parse(this.chart.sleepArch.hypno));
      this.createHypnoChart();
      this.calcHypnoStats();
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
    // CHART CREATORS 
    createHypnoChart(){
      var ctx = document.getElementById('hypno-chart' + this.index).getContext('2d');
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
    }
  },
  template: `
  <div>
    <div class="sleep_record_container" style="height:300px">
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
  </div>
  `
})