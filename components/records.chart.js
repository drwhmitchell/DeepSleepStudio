// Dynamically creates a chart of biometric information (HR, Motion) added on the to the DOM element passed in
// Returns a ref to the chart object so that it can be cleaned up
const RecordsChart = Vue.component('records-chart', {
    data() {
      return { 
        statsList: null,
      }
    },
    props:{
      chart: null,
      index: null
    },
    mounted(){
      if(this.chart){
        this.createRecordsChart();
        this.createStatsList();
      }
    },
    methods: {
      // CHART CREATORS 
      createStatsList(){
        this.statsList = [
            {
              inBedRecords: (this.chart.inBedData.length / 2 - 1),
              asleepRecords: this.chart.asleepData.length
            }
          ]
      },
      createRecordsChart(){
        var newSleepData = [{x: this.chart.sleepExtents.start, y: 2}];   // Seed the new Marshalled Sleep Record array with an "awake" point
        this.chart.asleepData.forEach((rec, i) => { newSleepData.push({x: rec.startdate, y: 1}); 
                                         newSleepData.push({x: rec.enddate, y: 2}) });
        newSleepData.push({x: this.chart.sleepExtents.end, y: 2});   // Postfix the Marshalled Sleep Record array with an "awake" point

        
        var ctx = document.getElementById('records-chart' + this.index).getContext('2d');
        const sleepRecordsChart = new Chart(ctx, {
          data: {
              datasets: [{
                  type: 'line',
                  label: 'Sleep Records',
                  yAxisID: 'SleepRecs',
                  stepped: 'true',
                  borderColor: "#B6BABB",
                  borderWidth : 3,
                  fill: false,
                  radius: 0,
                  data : newSleepData,
                  animations: {
                    tension: {
                      duration: 1000,
                      easing: 'linear',
                      from: 1,
                      to: -0.25,
                      loop: true,
                    }
                  }
                },{ 
                  type: 'line',
                  label: 'Inbed Records',
                  yAxisID: 'InbedRecs',
                  stepped: true,
                  borderColor: '#000080',
                  borderWidth : 3,
                  fill: false,
                  radius: 0,
                  data : this.chart.inBedData,
                }, { 
                  type: 'line',
                  yAxisID: 'SleepRecs',
                  stepped: true,
                  borderColor: '#000080',
      //             backgroundColor: '#000080',	
                  borderWidth : 3,
                  fill: false,
                  radius: 0,
                  data : this.chart.inBedData,
                }],
            },
            options: {
              layout: {
                padding: {
                    right: 12,
                    left: 7,
                }
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
                    display: true,
                    type: 'time',
                    time: {
                      unit: 'hour',  
                      displayFormats: {
                        hour: 'h a'
                      }
                    }, 
                    min: this.chart.sleepExtents.start,
                    max: this.chart.sleepExtents.end,
                  },
                  SleepRecs: {
                    type: 'linear',
                    display: true,
                    title: {
                      display : true,
                      text : 'Sleep Recs',
                      font : { size: 18},
                    },
                    position: 'left',
                    min: 0,
                    max: 6,
                    
                    ticks: {
                      beginAtZero: true,
                      min: 0,
                      max: 6,
                      stepSize: 1,
                      callback: function(label, index, labels) {
                        switch (label) {
                          case 0:
                            return '';
                          case 1:
                            return 'SLEEP';
                          case 2:
                            return 'WAKE';
      
                        }
                      }
                    }
      
                  },
                  InbedRecs: {
                    type: 'linear',
                    display: true,
                    title: {
                      display : true,
                      text : 'InBed Recs',
                      font : { size: 18},
                    },
                    position: 'right',
                    min: 0,
                    max: 6,
                    grid: {
                    drawOnChartArea: true, // only want the grid lines for one axis to show up
                    },
      
                    ticks: {
                      beginAtZero: true,
                      min: 0,
                      max: 6,
                      stepSize: 1,
                      callback: function(label, index, labels) {
                        switch (label) {
                          case 4:
                            return 'INBED';
                          case 5:
                            return ' UP';
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
            <canvas style="height:300px" v-bind:id="'records-chart' + index"></canvas>
        </div>
        <div v-if="statsList">
            <div v-for="(stats, index) in statsList" :key="index" class="text-center" style="background-color: #F5F4F8">
                <small>
                # InBed Records: {{ stats.inBedRecords }}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                # Asleep Records: {{ stats.asleepRecords }}
                </small>
            </div>
        </div>
    </div>
    `
  })