// runnign the system
// socketServer is the web page that gets control messages
const SocketServer = require("./modules/socketserver.module.js").SocketServer;
const MidiParser = require("./modules/midiparser.module.js").MidiParser;
const Choir = require("./modules/choir.module.js").Choir;
//const Pareto = require("./modules/pareto.module.js").Pareto;
const db = require('./modules/debugging.module.js').Debugging;


//let PARETO_IP = "10.0.0.200"; //"192.168.1.126";//
//http://192.168.1.126:8082/index.html
//let PARETO_PORT = "3001";


/*
const { io } = require("socket.io-client");
const paretoclient = io("http://"+PARETO_IP+":"+PARETO_PORT);
// client-side
paretoclient.on("connect", () => {
    console.log("socketio connect ", socket.id); // x8WIv7-mJelg7on_ALbx
});
  
paretoclient.on("disconnect", () => {
  console.log("socketio disconnect", socket.id); // undefined
});

paretoclient.on("connect_error", (error) => {
  if (socket.active) {
    // temporary failure, the socket will automatically try to reconnect
    } else {
        // the connection was denied by the server
        // in that case, `socket.connect()` must be manually called in order to reconnect
        console.log("socketio connect error " ,error.message);
    }
});
*/



// TURN DEBUGGING ON/OFF HERE
db.active = true;
db.trace = false;
db.log("starting","now",[1,2,3]);


let WEBSOCKET_PORT= 8098;
let WEBSERVER_PORT = 8083;
let UDPLISTENPORT = 8089; // I've nset up a node-RED implementaiton that spews out /pareto/raddec and /pareto/dynamb json
let default_webpage = "index.html";


//let midifile = "12Days.mid"; // too christmassy?
//let midifile = "mfrosty.mid"; // this one is good.
//let midifile = "dingdong.mid"; // this one is good.
// GrandmaGotRanOverByAReindeer // good!
//let midifile = "holidaymedley.mid"; // nope
// Pogues_Fairy_Tale_In_New_York_City.mid
let midifile = "Pogues_Fairy_Tale_In_New_York_City.mid";  // best one
//let midifile = "Happy-Birthday.mid"; // short, for testing
let mididir = "html/midi";


let playing = false;
let scorestarttime = 0;

let parser = Object.create(MidiParser);
parser.db = db;
parser.midiFile = mididir + "/"+ midifile; 
parser.startTime = (new Date()).getTime() + 10000 ; // add 10 seconds
parser.parseMidiFile();

let choir = Object.create(Choir);
console.log("parser channels",Object.keys(parser.channels) )
choir.init();
choir.allChannels = Object.keys(parser.channels);

console.log("all midi file channels used ", parser.channels, parser.numChannels);


SocketServer.WEBSOCKET_PORT  = WEBSOCKET_PORT;
SocketServer.WEBSERVER_PORT  = WEBSERVER_PORT;
SocketServer.default_webpage = default_webpage;
socket = Object.create(SocketServer);
socket.db = db;

socket.setMessageReceivedCallback(function(msg, ip){

    console.log("messageReveived", msg, ip);

    routeFromWebsocket(msg, ip, "gettime", function(msg){
        console.log("gettime", msg);
        let clientnow = msg.clienttime;
        let now = Date.now();
        console.log(now, clientnow, now-clientnow);
        let data = {
            servernow: now,
            clientnow: clientnow,
//            difference: now - clientnow
            difference: clientnow - now
        }
        socket.sendMessage("servertime", data, ip);    
    });


    routeFromWebsocket(msg, ip, "memberstart", function(msg, ip){
        console.log("memberstart", msg);
        console.log("adding member", msg, ip);
        choir.addMember(msg.uniqID, ip);
        choir.distributeChannels();
        sendUpdatedChannels(choir);
        console.log("added member", choir);

        if(scorestarttime == 0){
            let clienttime = msg.clienttime;
            scorestarttime = clienttime + 5000; // wait 5 seconds;
        }
        let data ={starttime: scorestarttime, uniqID : msg.uniqID, midifile: midifile};
        socket.sendMessage("startplaying", data, ip);
    });

    routeFromWebsocket(msg,  ip, "startscore", function(msg){    
        if(playing){
            return;
        } 
        playing = true;
    });

    routeFromWebsocket(msg, ip, "songover", function(msg){
        songOver();
    });
});

socket.setDisconnectCallback(function(ip){
    choir.removeMember(ip);
    if(choir.hasMembers()){
        choir.distributeChannels();
        sendUpdatedChannels(choir);
    }else{
        songOver();
    }
});


function songOver(){
    console.log("song over");
    playing = false;
    scorestarttime = 0;
   
}

function sendUpdatedChannels(choir){
    choir.allMembersCallback(function(key, member){
        let data = {uniqID: key, channelList : member.channels, allChannels: choir.allChannels};
        console.log("sending channels to member", data, member);
        socket.sendMessage("yourchannels", data, member.ip);
    });
}


// some websocket messages come in with a word preceding them, 
// which helps determine what they mean and where they should go.
// pass to Route to send to a specific callback.
// return true if the route was a match, false otherwise.
function routeFromWebsocket(msg, ip, route, callback){
    console.log("routeFromWebsocket", msg);
    let channel = false;
    let newmsg = false;
    if(msg.address){
        channel = msg.address; 
        newmsg = msg.data;       
    }else{
        let split = msg.split(/ /);
        channel = split.shift();
        newmsg = split.join(" ");
    }
    if(channel.toLowerCase() == route.toLowerCase()){
        callback(newmsg, ip);
        return true;
    }
    return false;
}



/*
paretoclient.on("raddec", (raddec) => { 
    let transmitterId = raddec.transmitterId;
    let rssi =raddec.rssiSignature[0].rssi;
    rssiMessage(transmitterId, rssi);
});
paretoclient.on("dynamb", (dynamb) => { 
    let deviceId = dynamb.deviceId;
    let value = dynamb;
    pareto.addDynamb(deviceId,dynamb);

});
*/

/*
function rssiMessage(transmitterId, rssi){
 //   console.log("rssi", transmitterId, rssi);
    pareto.addRaddec(transmitterId, rssi);
}
*/


/////////////////////////////////////////
// routing function for handling all OSC messages
// oasMsg : osc message, with .address and .args address provided
// route : string or regex to match the address
// args: the message content
// callback function(oscMsg, routematches)
// -- the orginal OSCMsg, with propery simpleValue added, 
//    which is the best we could do to get the sent message value as a simple value or JSON array
// -- the address split into an arrqy on /
function routeFromOSC(oscMsg, route, callback){

    // get teh OSC value. Need to figure out types here, 
    let value = oscMsg.args;
    let newvalue = false;
/*
    db.log("got oscMsg " + value, value);
    db.log(oscMsg);
    db.log(typeof value);
*/
    if(typeof value == "number"){
        newvalue = value;
    }else if(Array.isArray(value) && value.length == 1 && Object.hasOwn(value[0], "value")){
        if(value[0].type == "s"){
            try{
                newvalue = JSON.parse(value[0].value);
            }catch(e){
                newvalue = value[0].value;
            }
        }else{
            newvalue = value[0].value;
        }
    }else if(Array.isArray(value) && value.length > 1 && Object.hasOwn(value[0], "value")){
        newvalue = [];
        for(let i = 0; i < value.length; i++){
            if(value[0].type == "s"){
                try{
                    newvalue[i] = JSON.parse(value[i].value);
                }catch(e){
                    newvalue[i] = value[i].value;
                }
            }else{
                newvalue[i] = value[i].value;
            }
        }
    }else{
        db.log("!!!!!!!!!!!!!! ");
        db.log("don't know what value is " + Array.isArray(value) + " : " + value.length + " type :" + typeof value);
    }

    oscMsg.simpleValue = newvalue;

    let matches = oscMsg.address.match(route);
    if(matches){
        let split = oscMsg.address.split("/");
        callback(oscMsg, split);
    }
}


/*
pareto.iterateRaddecs(500, 10, function(raddecColl){
 //   console.log("gonna send these raddecs", raddecColl);
    socket.sendMessage("raddecupdate", raddecColl);
});
*/

// there aren't that many dynambs usually, so we'll send them all each time.
/*
setInterval(function(){
    let data = {
        dynambvals : pareto.dynambvals,
        dynambs : pareto.dynambs,
        dynambicons: pareto.dynambicons
    };
    socket.sendMessage("dynambupdate", data);

}, 2000);
*/


// start the socket server and the web server
socket.startSocketServer();
socket.startWebServer();

