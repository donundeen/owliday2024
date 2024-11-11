let Pareto = {

    raddecs: {},
    raddecKeys: [];
    dyanmbs : {},
    dynambKeys : [];
    numraddecs : 0,
    numdynambs : 0,

    currentRaddecIndex : 0,
    currentDynambIndex : 0,
    iteratingRaddecs = false,
    iteratingDynambs = false,

    init(){
    },

    addRaddec(id, rssi){
        this.raddecs[id] = {
            transmittedId : id, 
            rssi : rssi
        };
        this.raddecKeys = Object.keys(this.raddecs);
        this.numraddecs = Object.keys(this.raddecs).length;
    },

    addDynamb(id, data){
        this.dyanmbs[id] = {
            deviceId : id, 
            data : data
        };        
        this.dynambKeys = Object.keys(this.dyanmbs);
        this.numdynambs = Object.keys(this.dyanmbs).length;

    },

    iterateRaddecs(intervalMs, numPerIteration, callback){
        if(this.iteratingRaddecs){
            return;
        }
        this.currentRaddecIndex = 0;
        this.iteratingRaddecs = true;
        setInterval(function(){
            let count = 0;
            let raddecColl = [];
            while(count < numPerIteration){
                if(this.currentRaddecIndex >= this.numraddecs){
                    this.currentRaddecIndex = 0;
                }
                raddecColl.push(this.raddecs[this.raddecKeys[this.currentRaddecIndex]]);
                this.currentRaddecIndex++;
                count++;
            }
            callback(raddecColl);
        }, interval);
    },




}

exports.Pareto = Pareto;