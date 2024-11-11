let Pareto = {

    raddecs: {},
    dyanmbs : {},
    numraddecs : 0,
    numdynambs : 0,

    init(){
    },

    addRaddec(id, rssi){
        this.raddecs[id] = {
            transmittedId : id, 
            rssi : rssi
        };
        this.numraddecs = Object.keys(this.raddecs).length;
    },

    addDynamb(id, data){
        this.dyanmbs[id] = {
            deviceId : id, 
            data : data
        };        
        this.numdynambs = Object.keys(this.dyanmbs).length;

    }



}

exports.Pareto = Pareto;