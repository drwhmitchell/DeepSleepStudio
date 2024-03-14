

class HypnoStage {
    width; // Flex width
    color;
    startTime; // start in epoch
    endTime; // end in epoch
    startTimeLabel; 
    endTimeLabel;
    duration; // duration in seconds
    state;
    stateEnum;
    nextStateEnum;
    sleepDuration

    constructor(current,next, sleep_duration) {  // current state, next state
        this.sleepDuration  = sleep_duration;
        this.width          = (  (new Date(current.x).getTime() - new Date(next.x).getTime())/sleep_duration );
        this.color          = this.getColorFromState(current.y);
        this.startTime      = new Date(current.x).getTime();
        this.endTime        = new Date(next.x).getTime();
        this.state          = this.getStateFromNum(current.y);
        this.duration       = Math.round((new Date(next.x).getTime() - new Date(current.x).getTime())/60/1000); // DURATION IN MINS 
        this.stateNum       = current.y;
        this.nextStateNum   = next.y;
        this.setStartEndLabels();
    };



    setStartEndLabels(){
      this.startTimeLabel = new Date(this.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      this.endTimeLabel   = new Date(this.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    updateNextStageState(nextStage){  // Args = HypnoStage 
      this.nextStateNum = nextStage.stateNum;
    }

    updateTime(durationDeltaMins, newSleepDuration){ // Update everything related to time from duration delta;
      let durationDeltaMs = durationDeltaMins * 60000;
      this.startTime += durationDeltaMs;
      this.endTime += durationDeltaMs;
      this.setStartEndLabels();
      this.width = this.width * (newSleepDuration/this.sleepDuration);
      this.sleepDuration = newSleepDuration;
    }

    updateFromEdits(stageEdits){ // Args = HypnoStage (edits)
      this.state    = stageEdits.state;
      this.stateNum = this.getNumFromState();
      this.color    = this.getColorFromState(this.stateNum);
      let durationDeltaMins = stageEdits.duration - this.duration;
      if(durationDeltaMins != 0){
        let durationDeltaMs = durationDeltaMins * 60000;
        this.endTime += durationDeltaMs;
        this.setStartEndLabels();
        this.width = this.width * (stageEdits.duration/ this.duration);
        this.duration = Number(stageEdits.duration);
      }
    };



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
    };
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
      };

      getNumFromState(){
        switch(this.state){
          case 'Wake':
          default:
            return SleepStages.WAKE;
          case 'REM':
            return SleepStages.REM;
          case 'Light':
            return SleepStages.LIGHT;
          case 'Deep':
            return SleepStages.DEEP;
            
          
        }
      }

      
  

};









