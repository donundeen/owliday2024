// runnign the system
// socketServer is the web page that gets control messages
const SocketServer = require("./modules/socketserver.module.js").SocketServer;
const MidiParser = require("./modules/midiparser.module.js").MidiParser;
const Choir = require("./modules/choir.module.js").Choir;
const Pareto = require("./modules/pareto.module.js").Pareto;
const db = require('./modules/debugging.module.js').Debugging;




// TURN DEBUGGING ON/OFF HERE
db.active = true;
db.trace = false;
db.log("starting","now",[1,2,3]);


let WEBSOCKET_PORT= 8099;
let WEBSERVER_PORT = 8082;
let UDPLISTENPORT = 8089;
let default_webpage = "index.html";

var osc = require("osc");

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: UDPLISTENPORT, // this port for listening
    broadcast: true,
    metadata: true
});
udpPort.open();


let playing = false;
let scorestarttime = 0;

let parser = Object.create(MidiParser);
parser.db = db;
parser.midiFile = "html/midi/12Days.mid"; 
parser.startTime = (new Date()).getTime() + 10000 ; // add 10 seconds
parser.parseMidiFile();

let choir = Object.create(Choir);
console.log("parser channels",Object.keys(parser.channels) )
choir.init();
choir.allChannels = Object.keys(parser.channels);

let pareto = Object.create(Pareto);
pareto.init();

console.log("all midi file channels used ", parser.channels, parser.numChannels);


SocketServer.WEBSOCKET_PORT  = WEBSOCKET_PORT;
SocketServer.WEBSERVER_PORT  = WEBSERVER_PORT;
SocketServer.default_webpage = default_webpage;
socket = Object.create(SocketServer);
socket.db = db;

socket.setMessageReceivedCallback(function(msg, ip){

    console.log("messageReveived", msg, ip);
    // this is the format for handling messages.
    // getscore ask for the contents and name of the current score
    routeFromWebsocket(msg, ip, "getscore", function(msg){     
        let data = {scorename : score.scoreFilename,
                text: score.scoreText};
        socket.sendMessage("score", parser.parsedFile);    
    });

    routeFromWebsocket(msg, ip, "gettime", function(msg){
        console.log("gettime", msg);
        let clientnow = msg.clienttime;
        let now = Date.now();
        console.log(now, clientnow, now-clientnow);
        let data = {
            servernow: now,
            clientnow: clientnow,
            difference: now - clientnow
        }
        socket.sendMessage("servertime", data);    
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
            scorestarttime = clienttime + 1000; // wait 5 seconds;
        }
        let data ={starttime: scorestarttime, uniqID : msg.uniqID};
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


// handling messages over OSC/UDP
udpPort.on("message", function (oscMsg) {
    // when an OSC messages comes in
//    console.log("An OSC message just arrived!", oscMsg);
    // pass the message to the orchestra, which controls all the instruments
//    orchestra.parseOSC(oscMsg.address, oscMsg.args);

    // announcing local instruments to create them in the orchestra
    // NOTE: all localInstrument stuff is broken, needs updating
    routeFromOSC(oscMsg, "/pareto/raddec", function(oscMsg, address){
        let transmitterId = oscMsg.simpleValue.transmitterId;
        let rssi = oscMsg.simpleValue.rssiSignature[0].rssi;
        rssiMessage(transmitterId, rssi);
        let value = oscMsg.simpleValue;
        pareto.addRaddec(transmitterId, rssi);
    });

    routeFromOSC(oscMsg, "/pareto/dynamb", function(oscMsg, address){
        console.log("dynamb", oscMsg.simpleValue);
        let deviceId = oscMsg.simpleValue.deviceId;
        let value = oscMsg.simpleValue;
        pareto.addDynamb(deviceId, oscMsg.simpleValue);
    });

});


function rssiMessage(transmitterId, rssi){
    console.log("rssi", transmitterId, rssi);

}



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

pareto.iterateRaddecs(500, 10, function(raddecColl){
    console.log("gonna send these raddecs", raddecColl);
    socket.sendMessage("raddecupdate", raddecColl);
});


// start the socket server and the web server
socket.startSocketServer();
socket.startWebServer();

