let Pareto = {

    raddecs: {},
    raddecKeys: [],
    dynambs : {},
    dynambKeys : [],
    numraddecs : 0,
    numdynambs : 0,

    currentRaddecIndex : 0,
    currentDynambIndex : 0,
    iteratingRaddecs : false,
    iteratingDynambs : false,

    dynambvals : {},


    dynambicons :{
        acceleration: "🚀",
        isLiquidDetected: "💧",
        temperature: "🌡️",
        relativeHumidity: "💦",
        illuminance: "☀️",
        isMotionDetected: "🏃🏻‍♀️",
        numberOfOccupants:"👪🏽",
        batteryPercentage: "🔋"
    },


    init(){
    },

    addRaddec(id, rssi){
        this.raddecs[id] = {
            transmitterId : id, 
            rssi : rssi
        };
        this.raddecKeys = Object.keys(this.raddecs);
        this.numraddecs = Object.keys(this.raddecs).length;
    },

    addDynamb(id, data){
        this.dynambs[id] = {
            deviceId : id, 
            data : data
        };        
        this.dynambvals = {...this.dynambvals , ...data};
        console.log("new dynamb", this.dynambvals);
        this.dynambKeys = Object.keys(this.dyanmbs);
        this.numdynambs = Object.keys(this.dyanmbs).length;

    },

    iterateRaddecs(interval, numPerIteration, callback){
        if(this.iteratingRaddecs){
            return;
        }
        this.currentRaddecIndex = 0;
        this.iteratingRaddecs = true;
        let self = this;
        setInterval(function(){
            if(self.numraddecs==0){
                return;
            }
            let count = 0;
            let raddecColl = [];
            while(count < numPerIteration){
                if(self.currentRaddecIndex >= self.numraddecs){
                    self.currentRaddecIndex = 0;
                }
                raddecColl.push(self.raddecs[self.raddecKeys[self.currentRaddecIndex]]);
                self.currentRaddecIndex++;
                count++;
            }
            callback(raddecColl);
        }, interval);
    },
}

exports.Pareto = Pareto;