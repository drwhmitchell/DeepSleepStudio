// const SleepStages = Object.freeze({
//     WAKE: 4,
//     REM: 3,
//     LIGHT:2,
//     DEEP: 1
//   });

  
var editHypnoApp = new Vue({
    el: '#editHypnoApp',
    components: {},
    data(){
        return {
            chart: null,
            chartData: [],
            hypno: null,
            statsList: null,
            hypnoChart: null,
            selectedStage: null,
            selectedStageIndex: null,
            stageHeight: '15px',
            stages:[
              { name: "Wake", enum: SleepStages.WAKE },
              { name: "REM", enum: SleepStages.REM},
              { name: "Light", enum: SleepStages.LIGHT},
              { name: "Deep", enum: SleepStages.DEEP}
            ],
            xAxis:{
              labels: [],
              start: null,
              end: null,
              duration: null
            }
        }
    },
    mounted(){
        console.log('EDIT HYPNO APP INITIALIZED')
        messenger.$on('edit-hypno', ()=> {
            this.init();
        });
        this.init();
    },
    methods:{
        init(){
          this.chart = HypnoData.get();
          if(this.chart){
            console.log("CHART ", this.chart)
            this.chartData = SynthUtils.marshallSleepNetHypno(JSON.parse(this.chart.sleepArch.hypno));
            this.initializeHypno();
            this.initializeAxis();
          }
        },
        goBack(){ 
            this.resetVm();
            messenger.$emit('go-back');
        },
        resetVm(){
          this.chart = null;
          this.hypno = null;
          this.selectedStage = null;
          this.selectedStageIndex = null;
        },
        initializeHypno(){
            //this.chartData = SynthUtils.marshallSleepNetHypno(JSON.parse(this.chart.sleepArch.hypno));
            if(this.chartData && this.chartData.length > 0){
              this.hypno = new Hypno(this.chartData, this.chart.sleepArch);
              console.log("HYPNO ", this.hypno)
            }
          },
          initializeAxis(){
            this.xAxis.start     = Helpers.getClosestHourBeforeEpochTime(this.chartData[0].x);
            this.xAxis.end       = Helpers.getClosestHourAfterEpochTime(this.chartData[this.chartData.length - 1].x);
            this.xAxis.labels    = Helpers.getHoursBetweenEpochTimes(this.xAxis.start, this.xAxis.end );
            this.xAxis.duration  = this.xAxis.end - this.xAxis.start;
          },
          editStage(divIndex){
            if(this.selectedStageIndex != divIndex){
              this.selectedStageIndex = divIndex;
              this.selectedStage = JSON.parse(JSON.stringify( this.hypno.stages[divIndex])); // deep clone if editing
            } 
          },
          updateStage(){
            console.log('UPDATE HYPNO')
            this.hypno.updateStage(this.selectedStage, this.selectedStageIndex);
            setTimeout(()=>{
              this.selectedStage = JSON.parse(JSON.stringify( this.hypno.stages[this.selectedStageIndex]))
            },10)
          },
          resetStage(){
            // TODO reset stage from chart data 
            this.selectedStageIndex = null;
            this.selectedStage = null;
            this.hypno.reset();
          },
          saveStageEdits(){
            this.selectedStageIndex = null;
            this.selectedStage = null;
            this.saveHypno();  
          },
          saveHypno(){
            console.log("SAVE HYPNO")
            // TODO!! Save hypno based off edits for range divs (stages) -- or start/end slider (todo)
          },
    },
    computed:{
        stageBackground() {
            return function(item, divState) {
              if(item.stateNum == divState){
                return `linear-gradient(to bottom, ${item.color} ${this.stageHeight}, transparent ${this.stageHeight})`
              }
              else{
                return 'transparent';
              }
            }
          },
          stageOuterRightBorder() {
            return function(item, divState, divIndex) {
              if(divIndex > this.hypno.length){
                return 'none'; 
              }
              else{
                let borderSizeType = '3px solid ';
                if(item.nextStateNum > item.stateNum){
                  return (divState <= item.nextStateNum) && (divState > item.stateNum)
                    ? borderSizeType + item.color
                    : 'transparent';
                }
                else{
                  return (divState > item.nextStateNum) && (divState <= item.stateNum)
                    ? borderSizeType + item.color
                    : 'none';
                }
              }
            }
          },
          stageInnerRightBorder(){
            return function(item,divState){
              let borderSizeType = '3px solid ';
            if((item.nextStateNum == divState) && divState < item.stateNum){
              return borderSizeType + item.color;
            }
            else{
                return 'none';
              }
            }
          },
          hypnoStartFlex(){
            return function(){
              if(this.chartData){
                let start_offset  =  this.chartData[0].x - this.xAxis.start
                return start_offset/this.xAxis.duration
              }
            }
          },
          hypnoFlex(){
            return function(){
              if(this.chartData){
                let hypno_duration = this.chartData[this.chartData.length - 1].x - this.chartData[0].x;
                return this.xAxis.duration/hypno_duration;
              }
            }
          },
          hypnoEndFlex(){
            return function(){
              if(this.chartData){
                let end_offset  =  this.xAxis.end - this.chartData[this.chartData.length - 1].x;
                return end_offset/this.xAxis.duration
              }
            }
          }

    },
    watch:{
        hypno: {
          deep: true,
          handler: _.debounce(function () {

              // TODO: update to simulate change
          }, 1000)
        }
    }

})