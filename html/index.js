let WEBSOCKET_PORT= 8099;
let WEBSERVER_PORT = 8082;

let midifile = "midi/12Days.mid";

var player;
var playing = false;
var out;

let started = false;

let tinysynth = false; //JZZ().openMidiOut('Web Audio');

let timeskew = 0;

let firstnoteplayed = false;

let uniqID = Math.random() * 10000 * Date.now(); 

let myChannels = []; // array of channel numbers that I'm playing. The others get turned down.
let allChannels = []; // array of all channel numbers

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
        let data = {clienttime: now, uniqID: uniqID};
        message("memberstart", data);
        


        /*
        setInterval(function(){
            midiMakeNote(Math.floor(Math.random() * 24) + 64, 127, 500);

        },200)
        */
//        message("startscore", true);


        
        JZZ.synth.Tiny.register('Web Audio');
        tinysynth = JZZ().openMidiOut('Web Audio');
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
        let data = {uniqID: uniqID};
        message("newchoirmember", data);
     //   message("ready", data);
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


        if(msg.address == "playnote"){
            midiMakeNote(msg.data.pitch, msg.data.velocity, msg.data.duration)
        }

        if(msg.address == "servertime"){
            processServerTime(msg);
        }

        if(msg.address == "startplaying"){
            if(!playing && msg.data.uniqID == uniqID){
                startMidiFile(msg.data.starttime);
            }
        }

        if(msg.address == "yourchannels"){
            // getting the list of channels for this player
            console.log("yourchannels", msg);
            if(msg.data.uniqID == uniqID){
                updateChannels(msg.data.channelList, msg.data.allChannels);
            }
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


function setMidiVoice(channel, bank, program){
    // assuming default bank.
    tinysynth.program(channel, program);

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
//        player = JZZ.MIDI.SMF(data).player();
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

            let seektime = correctedNow()- starttime;
            console.log("seeking to " + player.ms2tick(seektime));
            playing = true;
            player.play();
            player.jump(player.ms2tick(seektime));
            setTimeout(function(){
             //   player.stop();
            },1000);
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

function midievent(midievent){
    console.log(midievent,
        midievent.getChannel(), 
        midievent.getNote(),  
        midievent.getVelocity(), 
        midievent.getTempo(), 
        midievent.getBPM(),
        midievent.getSysExId(),
        midievent.getText(),
        midievent.getData(),
        midievent.isProgName(),
        midievent.isFullSysEx(),
        midievent.isMidi(),
        midievent.isNoteOn()
    );

    if( !firstnoteplayed && midievent.isNoteOn()){
        firstnoteplayed = true;
        doAtFirstNote();
    }
}

function doAtFirstNote(){
    setupChannelPrograms()
    setupChannelVolumes();
}

function updateChannels(_myChannels, _allchannels){
    myChannels = _myChannels;
    allChannels = _allchannels;
    if(playing){
        setupChannelVolumes();
    }
}

function setupChannelPrograms(){
    tinysynth.program(0, Math.floor(Math.random()* 127));
    tinysynth.program(1, Math.floor(Math.random()* 127));
    tinysynth.program(2, Math.floor(Math.random()* 127));
    tinysynth.program(3, Math.floor(Math.random()* 127));
    tinysynth.program(4, Math.floor(Math.random()* 127));
    tinysynth.program(5, Math.floor(Math.random()* 127));
    tinysynth.program(6, Math.floor(Math.random()* 127));
    //   out = JZZ().or(console.log('Cannot start MIDI engine!')).openMidiOut().or(console.log('Cannot open MIDI Out!'));
}

function setupChannelVolumes(){
    for(var i = 0; i < allChannels.length; i++){
        let channel = allChannels[i];
        if(myChannels.includes(channel)){
            tinysynth.volumeF(channel, 1.0);
        }else{
            tinysynth.volumeF(channel, 0.0);
        }
    }
}