// Dynamically creates a chart of biometric information (HR, Motion) added on the to the DOM element passed in
// Returns a ref to the chart object so that it can be cleaned up
const BioChart = Vue.component('bio-chart', {
    data() {
      return {
        aeMax: 3.0 // scales the ActiveEnergy
      }
    },
    props:{
      chart: null,
      index: null
    },
    mounted(){
      if(this.chart){
        this.createBioChart();
      }
    },
    methods: {
      // CHART CREATORS 
      createBioChart(){
        var ctx = document.getElementById('bio-chart' + this.index).getContext('2d');
        const bioChart = new Chart(ctx, {
            data: {
                datasets: [{
                    type: 'line',
                    label: 'Heartrate',
                    yAxisID: 'HR',
                    borderColor: '#C70039',	
                    backgroundColor: '#C70039',	
                    data : this.chart.hrData || [],
                    animations: {
                      tension: {
                        duration: 1000,
          //              easing: 'linear',
                        from: 1,
                        to: -0.25,
                        loop: true,
                      }
                    }
                  },{ 
                    type: 'line',
                    label: 'Motion',
                    yAxisID: 'AE',
                    borderColor: '#000080',
                    backgroundColor: '#000080',	
                    pointStyle: 'circle',
                    radius: 0,
                    stepped: true,
                    data : this.chart.aeData || [],
                  }],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend : {
                    display: false,
                  },
                  title: {
                    display: false,
                    text: this.chart.chartName,
                    font : { size: 18},
                  }
                },
                scales: {
                  x: {
                    display: true,
                    type: 'time',
                    bounds: 'data',
                    min: this.chart.sleepExtents.start,
                    max: this.chart.sleepExtents.end,
                    time: {
                      unit: 'hour',  
                      displayFormats: {
                        hour: 'h a'
                      },
                    },
                  },
                  HR: {
                    type: 'linear',
                    display: true,
                    title: {
                      display : true,
                      text : 'Heartrate',
                      padding: 15,
                      font : { size: 18},
                    },
                    position: 'left',
                  },
                  AE: {
                    type: 'linear',
                    display: true,
                    title: {
                      display : true,
                      text : 'Motion',
                      padding: 15,
                      font : { size: 18},
                    },
                    position: 'right',
                    min: 0,
                    max: this.aeMax,
                    grid: {
                      drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                  }
                }
              }
          });
      }
    },
    template: `
    <div class="sleep_record_container" style="height:300px">
        <canvas style="height:300px" v-bind:id="'bio-chart' + index"></canvas>
    </div>
    `
  })