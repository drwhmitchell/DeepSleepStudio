class HypnoData{

    data = null;

    static get(){
        if(this.data){
            return   JSON.parse(JSON.stringify(this.data));
        }
        else{
            return null
        }
        //return  {"chartName":"Trued","sleepExtents":{"start":1710220266000,"end":1710258421000},"sleepArch":{"id":26218,"userid":3,"createdat":"2024-03-12T15:37:32.005046Z","source":"Trued","use":true,"hypno":"[{\"x\":\"Wake\",\"y\":[1710228121000,1710229921000]},{\"x\":\"Deep\",\"y\":[1710229921000,1710230821000]},{\"x\":\"REM\",\"y\":[1710230821000,1710231421000]},{\"x\":\"Light\",\"y\":[1710231421000,1710232321000]},{\"x\":\"Deep\",\"y\":[1710232321000,1710234121000]},{\"x\":\"Light\",\"y\":[1710234121000,1710235321000]},{\"x\":\"Deep\",\"y\":[1710235321000,1710236221000]},{\"x\":\"Light\",\"y\":[1710236221000,1710236821000]},{\"x\":\"Deep\",\"y\":[1710236821000,1710237121000]},{\"x\":\"Light\",\"y\":[1710237121000,1710237721000]},{\"x\":\"Wake\",\"y\":[1710237721000,1710238021000]},{\"x\":\"Light\",\"y\":[1710238021000,1710239521000]},{\"x\":\"Deep\",\"y\":[1710239521000,1710241621000]},{\"x\":\"Light\",\"y\":[1710241621000,1710242221000]},{\"x\":\"Wake\",\"y\":[1710242221000,1710242521000]},{\"x\":\"Light\",\"y\":[1710242521000,1710242821000]},{\"x\":\"Wake\",\"y\":[1710242821000,1710243121000]},{\"x\":\"Light\",\"y\":[1710243121000,1710243721000]},{\"x\":\"Wake\",\"y\":[1710243721000,1710244321000]},{\"x\":\"Light\",\"y\":[1710244321000,1710245821000]},{\"x\":\"REM\",\"y\":[1710245821000,1710246121000]},{\"x\":\"Wake\",\"y\":[1710246121000,1710247321000]},{\"x\":\"Light\",\"y\":[1710247321000,1710249721000]},{\"x\":\"Wake\",\"y\":[1710249721000,1710250021000]},{\"x\":\"Light\",\"y\":[1710250021000,1710250321000]},{\"x\":\"REM\",\"y\":[1710250321000,1710252121000]},{\"x\":\"Wake\",\"y\":[1710252121000,1710252421000]},{\"x\":\"REM\",\"y\":[1710252421000,1710253921000]},{\"x\":\"Light\",\"y\":[1710253921000,1710255121000]},{\"x\":\"REM\",\"y\":[1710255121000,1710255421000]},{\"x\":\"Wake\",\"y\":[1710255421000,1710256021000]},{\"x\":\"Light\",\"y\":[1710256021000,1710256921000]},{\"x\":\"Wake\",\"y\":[1710256921000,1710257821000]}]","hypnomodel":0,"motionlen":0,"energylen":0,"heartratelen":0,"standlen":0,"sleepsleeplen":0,"sleepinbedlen":0,"beginbedrel":26521000,"beginbed":1710228121000,"endbed":1710257821000,"hrmin":0,"hrmax":0,"hravg":0,"tst":22080000,"timeawake":4800000,"timerem":4380000,"timelight":11520000,"timedeep":6180000,"numawakes":8,"score":76,"scoreduration":0,"scoreefficiency":0,"scorecontinuity":0,"utcoffset":-25200000,"sleeponset":1800000,"sleepefficiency":0.7698744769874477,"finalized":false},"chartType":"hypno","isEditable":true,"name":"Trued hypno for Will Mitchell on 2024-03-12"};
    }

    static put(new_hypno_data){
        console.log("HYPNO DATA PUT ", JSON.stringify(new_hypno_data));
        this.data = JSON.parse(JSON.stringify(new_hypno_data));
    }

}