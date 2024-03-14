

class Hypno {
    dataSaved = []
    dataCopy  = [];
    sleep = {
        start: null, // Start in Epoch MS
        end: null, // End in Epoch MS
        duration: null // Duration in Epoch MS
    };
    stages = [];
    ksis = [
        {name: "Wake",  duration: null, stored: null},
        {name: "Light", duration: null, stored: null},
        {name: "REM",   duration: null, stored: null},
        {name: "Deep",  duration: null, stored: null},
        {name: "Total",  duration: null, stored: null}
    ];

    constructor(raw_hypno_data, sleepArch) {  //[{"x":"2024-03-10T07:16:05.000Z","y":4},{"x":"2024-03-10T07:51:05.000Z","y":2},...] raw data = x: start time of stage, y: enum for stage
        this.initialize(raw_hypno_data, sleepArch);
    };

    initialize(data, sleepArch){
        this.dataCopy  = data;
        this.dataSaved = JSON.parse(JSON.stringify(data))
        if(this.dataCopy && this.dataCopy.length > 0){
            this.setSleep();
            this.setStages();
        }
        if(sleepArch){
            this.setStoredKsis(sleepArch);
        }
    };
    setStoredKsis(sleepArch){
        this.ksis.forEach(x=>{
            let durationMs = 0;
            switch(x.name){
                case 'Wake':
                    durationMs = sleepArch.timeawake + sleepArch.sleeponset;
                    break;
                case 'Light':
                    durationMs = sleepArch.timelight;
                    break;
                case 'REM':
                    durationMs = sleepArch.timerem;
                    break;
                case "Deep":
                    durationMs = sleepArch.timedeep;
                    break;
                case "Total":
                    durationMs = sleepArch.tst;
                    break;
            }
            let durationMin = durationMs/60000;
            x.stored = Helpers.convertMinutesToHHMM(durationMin);
        })
    }
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
        this.calcKsis();
    };
    calcKsis(){
        let ksis = {
            "Wake": 0,
            "REM": 0,
            "Light": 0,
            "Deep": 0,
            "Total": 0
        };
        this.stages.forEach(x=>{
            ksis[x.state] += x.duration;
            if(x.state != "Wake"){
                ksis.Total += x.duration;
            }
        });
        this.ksis.forEach(x=>{
            x.duration = Helpers.convertMinutesToHHMM(ksis[x.name]);
        })
    }

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
            let durationDeltaMins = stage.duration - this.stages[index].duration;
            console.log("DURATION DELTA ", this.stages[index].duration)
            if(durationDeltaMins != 0){
                for(var i = index; i < this.stages.length; i++){
                    this.stages[i].updateTime(durationDeltaMins, this.sleep.duration);
                }
            }
        }
        this.calcKsis();

    };
    //RESETS UPDATES
    reset(){
        this.setStages();
    };


    

};









