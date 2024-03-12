

class Hypno {
    dataSaved = []
    dataCopy  = [];
    sleep = {
        start: null, // Start in Epoch MS
        end: null, // End in Epoch MS
        duration: null // Duration in Epoch MS
    };
    stages = []

    constructor(raw_hypno_data) {  //[{"x":"2024-03-10T07:16:05.000Z","y":4},{"x":"2024-03-10T07:51:05.000Z","y":2},...] raw data = x: start time of stage, y: enum for stage
        this.initialize(raw_hypno_data);
    };

    initialize(data){
        this.dataCopy  = data;
        this.dataSaved = JSON.parse(JSON.stringify(data))
        if(this.dataCopy && this.dataCopy.length > 0){
            this.setSleep();
            this.setStages();
        }
    };
    setSleep(){
        this.sleep.start    = new Date(this.dataCopy[0].x).getTime();
        this.sleep.end      = new Date(this.dataCopy[this.dataCopy.length - 1].x).getTime();
        this.sleep.duration = this.sleep.start - this.sleep.end;
    }
    setStages(){
        this.stages = [];
        for(var i = 0; i < this.dataCopy.length - 1; i++){
            this.stages.push(new HypnoStage(this.dataCopy[i], this.dataCopy[i + 1], this.sleep.duration))
        }
    };

    updateSleepFromStageDurationChange(durationDeltaMins){
        let durationDeltaMs = durationDeltaMins * 60000;
        this.sleep.end += durationDeltaMs;
        this.sleep.duration = this.sleep.start - this.sleep.end;
    }

    updateStage(stage,index){ // stage = HypnoStage being updated. Index = index of stage being updated
        let hasStageBefore = index > 0;
        let hasStageAfter  = index < (this.stages.length - 1);
        this.stages[index].updateFromEdits(stage);
        if(hasStageBefore){
            this.stages[index - 1].updateNextStageState(this.stages[index])
        }
        if(hasStageAfter){
            console.log("HAS STAGE AFTETR")
            console.log("STAGE DURATION ", stage.duration);
            console.log("STORED DURATION ", this.stages[index].duration)
            let durationDeltaMins = stage.duration - this.stages[index].duration;
            if(durationDeltaMins != 0){
                console.log("CHANGING OVERALL DURATION ")
                for(var i = index; i < this.stages.length; i++){
                    this.stages[i].updateTime(durationDeltaMins, this.sleep.duration);
                }
            }
        }

    };
    //RESETS UPDATES
    reset(){
        this.setStages();
    };


};









