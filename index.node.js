// runnign the system
// socketServer is the web page that gets control messages
const SocketServer = require("./modules/socketserver.module.js").SocketServer;
const MidiParser = require("./modules/midiparser.module.js").MidiParser;
const Choir = require("./modules/choir.module.js").Choir;
const db = require('./modules/debugging.module.js').Debugging;

// TURN DEBUGGING ON/OFF HERE
db.active = true;
db.trace = false;
db.log("starting","now",[1,2,3]);


let WEBSOCKET_PORT= 8099;
let WEBSERVER_PORT = 8082;
let default_webpage = "index.html";

let playing = false;
let scorestartime = 0;

let parser = Object.create(MidiParser);
parser.db = db;
parser.midiFile = "html/midi/12Days.mid"; 
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
        if(scorestartime == 0){
            let clienttime = msg.clienttime;
            scorestartime = clienttime + 1000; // wait 5 seconds;
        }
        let data ={starttime: scorestartime, uniqID : msg.uniqID};
        socket.sendMessage("startplaying", data, ip);
    });

    routeFromWebsocket(msg, ip, "newchoirmember", function(msg, ip){
        console.log("adding member", msg, ip);
        choir.addMember(msg.uniqID, ip);
        choir.distributeChannels();
        sendUpdatedChannels(choir);
        console.log("added member", choir);
    });

    routeFromWebsocket(msg,  ip,"startscore", function(msg){    
        if(playing){
            return;
        } 
        playing = true;
    });

    routeFromWebsocket(msg, ip, "songover", function(msg){
        playing = false;
        scorestartime = 0;
    });
});

socket.setDisconnectCallback(function(ip){
    choir.removeMember(ip);
    if(choir.hasMembers()){
        choir.distributeChannels();
        sendUpdatedChannels(choir);
    }else{
        playing = false;
        starttime = 0;
    }
});

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

// start the socket server and the web server
socket.startSocketServer();
socket.startWebServer();

