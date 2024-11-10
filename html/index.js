let WEBSOCKET_PORT= 8099;
let WEBSERVER_PORT = 8082;

let midifile = "midi/12Days.mid";

var player;
var playing = false;
var out;

let started = false;

let tinysynth = false; //JZZ().openMidiOut('Web Audio');

let timeskew = 0;

$(function() {


    
    setInterval(function(){
        $(".time2").text(Math.floor(correctedNow() / 1000));

    },10);
    
    console.log("starting");

    // chnage this depending on location of webserver. Figure out a way to make this more dynamic...
    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,"");
    // remove port
    console.log(host);


    $(".play").on("click", function(){

        if(started){
            return;
        }
        console.log("starting");
        started = true;

        let now = correctedNow();
        //let now = Date.now();
        let data = {clienttime: now};
        message("newchoirmember", data);
        


        /*
        setInterval(function(){
            midiMakeNote(Math.floor(Math.random() * 24) + 64, 127, 500);

        },200)
        */
//        message("startscore", true);


        
        JZZ.synth.Tiny.register('Web Audio');
        tinysynth = JZZ().openMidiOut('Web Audio');
     //   out = JZZ().or(console.log('Cannot start MIDI engine!')).openMidiOut().or(console.log('Cannot open MIDI Out!'));


/*
        JZZ.synth.Tiny().noteOn(0, 'C5', 127)
            .wait(500).noteOn(0, 'E5', 127)
            .wait(500).noteOn(0, 'G5', 127)
            .wait(500).noteOff(0, 'C5').noteOff(0, 'E5').noteOff(0, 'G5');
            */
//        fromURL();

    });


    // some note characters: 
    // ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 

    //  const ws = new WebSocket('ws://localhost:8080');
    //const ws = new WebSocket('ws://192.168.4.34:8080');
    //const ws = new WebSocket('ws://10.102.134.110:8080');
    const ws = new WebSocket('ws://'+host+':'+WEBSOCKET_PORT);

    let wsready = false;  
    // Browser WebSockets have slightly different syntax than `ws`.
    // Instead of EventEmitter syntax `on('open')`, you assign a callback
    // to the `onopen` property.
    ws.onopen = function() {
        wsready = true;
        console.log("opened " + ws.readyState);
        message("ready", "READY NOW")
    };

    ws.onerror = function(msg){
        console.log("ws error");
        console.log(msg);
    }

    ws.onclose = function(msg){
        console.log("wsclose");
        console.log(msg);
    }

    ws.onmessage = function(event) {
        console.log("got message ", event);
     //   midiMakeNote(64, 127, 500);
        msg = JSON.parse(event.data);
//        console.log(msg.address);
console.log(msg);

        // this is the format. Change the messages as needed
        if(msg.address == "score"){
            updateScore(msg.data);
        }

        if(msg.address == "playnote"){
            midiMakeNote(msg.data.pitch, msg.data.velocity, msg.data.duration)
        }

        if(msg.address == "servertime"){
            processServerTime(msg);
        }

        if(msg.address == "startplaying"){
            startMidiFile(msg.data.starttime);

        }

        // add message about adding a new instrument here
    }

    function message(address, data){

        let msg = {address : address,
            data: data};  

        console.log("sending message ", msg);
        if(wsready){
        //    var buf = new Buffer.from(JSON.stringify(msg));
            ws.send(JSON.stringify(msg));
        }else{
            console.log("ws not ready");
        }
    }

});



function correctedNow(){
    return  Date.now() + timeskew;
}

let notecount = 0;
function midiMakeNote(pitch, velocity, duration){
    if(!started){
        return;
    }
    notecount++;
    $(".time").text(notecount +" " +pitch + " "+ velocity + " " + duration);

    tinysynth.noteOn(0, pitch, velocity)
  //  .wait(duration).noteOff(0, pitch);
    
    setTimeout(function(){
       tinysynth.noteOff(0, pitch);
    }, duration);

}


function startMidiFile(starttime){
    let waittime = starttime - Date.now();
    console.log("starting midi file at", starttime, waittime);
    $(".dbg").text("starting at " + starttime + " in "+waittime);
    fromURL(starttime);
}

function fromURL(starttime) {
    console.log("fromURL");
    clear();
    var url = midifile;
    try {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            var r, i;
            var data = '';
            r = xhttp.response;
            if (r instanceof ArrayBuffer) {
              r = new Uint8Array(r);
              for (i = 0; i < r.length; i++) data += String.fromCharCode(r[i]);
            }
            else { // for really antique browsers
              r = xhttp.responseText;
              for (i = 0; i < r.length; i++) data += String.fromCharCode(r.charCodeAt(i) & 0xff);
            }
            load(data, url, starttime);
          }
          else {
            log.innerHTML = 'XMLHttpRequest error';
          }
        }
      };
      try { xhttp.responseType = 'arraybuffer'; } catch (e) {}
      xhttp.overrideMimeType('text/plain; charset=x-user-defined');
      xhttp.open('GET', url, true);
      xhttp.send();
    }
    catch (e) {
      log.innerHTML = 'XMLHttpRequest error';
    }
}

function load(data, name, starttime) {
    console.log("load", name);
    try {
        player = JZZ.MIDI.SMF(data).player();
        player.connect(tinysynth);
        player.connect(function(msg) {
            midievent(msg);
        });      
        player.onEnd = function() {
            playing = false;
        }
        let waittime = starttime - correctedNow();
        if(waittime > 0){
            console.log("waiting");
            setTimeout(function(){
                playing = true;
                player.play();        
            }, waittime);
        }else{
            let seektime = waittime * -1;
            playing = true;
            player.jumpMS(seektime);
            player.play();
        }
    }
    catch (e) {
        console.log(e);
    }
}

function clear() {
    if (player) player.stop();
    playing = false;
}

function playStop() {
    if (playing) {
      player.stop();
      playing = false;
    }
    else {
      player.play();
      playing = true;
    }
}

function midievent(msg){
    console.log(msg);
}