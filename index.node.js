// runnign the system
// socketServer is the web page that gets control messages
const SocketServer = require("./modules/socketserver.module.js").SocketServer;
const MidiParser = require("./modules/midiparser.module.js").MidiParser;

const db = require('./modules/debugging.module.js').Debugging;
// TURN DEBUGGING ON/OFF HERE
db.active = true;
db.trace = false;
db.log("starting","now",[1,2,3]);


let WEBSOCKET_PORT= 8099;
let WEBSERVER_PORT = 8082;
let default_webpage = "index.html";



parser = Object.create(MidiParser);
parser.db = db;
parser.midiFile = "html/midi/12Days.mid"; 
parser.startTime = (new Date()).getTime() + 10000 ; // add 10 seconds

parser.parseMidiFile();

SocketServer.WEBSOCKET_PORT  = WEBSOCKET_PORT;
SocketServer.WEBSERVER_PORT  = WEBSERVER_PORT;
SocketServer.default_webpage = default_webpage;
socket = Object.create(SocketServer);
socket.db = db;

socket.setMessageReceivedCallback(function(msg){

    // this is the format for handling messages.
    // getscore ask for the contents and name of the current score
    routeFromWebsocket(msg, "getscore", function(msg){     
        let data = {scorename : score.scoreFilename,
                text: score.scoreText};
        socket.sendMessage("score", parser.parsedFile);    
    });

});


// some websocket messages come in with a word preceding them, 
// which helps determine what they mean and where they should go.
// pass to Route to send to a specific callback.
// return true if the route was a match, false otherwise.
function routeFromWebsocket(msg, route, callback){
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
        callback(newmsg);
        return true;
    }
    return false;
}

// start the socket server and the web server
socket.startSocketServer();
socket.startWebServer();