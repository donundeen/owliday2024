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

let ws = false;
let wsready = false;  

var singerOrigWidth = 160;
var singerOrigHeight = 160;

var screenwidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
var screenheight = (window.innerHeight > 0) ? window.innerHeight : screen.height;

var singerWidth = Math.floor(screenwidth / 6);
var singerRatio = singerWidth / singerOrigWidth;
var singerHeight =  singerOrigHeight * singerRatio;

var singerSafeScreenWidth = screenwidth - singerWidth;
var singerSafeScreenHeight = screenheight - singerHeight;

var singerspots = [
    [],[],[],[],[],[], // 0-5
    [],[],[],[],[],[], // 6-11
    [],[],[],[],[],[], // 12-17
    [],[],[],[],[],[], // 18-23
    [],[],[],[],[],[], // 24-29
    [],[],[],[],[],[]
]; // 30-35
/*
0  1  2  3  4  5
6  7  8  9  10 11
12 13 14 15 16 17
18 19 20 21 22 23
24 25 26 27 28 29
*/
// order
// 14, 15, 20, 21, 13,16
let singerspotorder = [
    14,15,20,21,13,16,8,9,19,22,26,27,7,10,25,28,2,3,32,33,12,17,18,23,1,4,31,34,6,11,24,29,0,5,30,35
];


var numsingerrows = Math.floor(screenheight / singerHeight);
var numsingercols = Math.floor(screenwidth / singerWidth);
var spoti = 0;
for(var row = 0; row< numsingerrows; row++){
    var y = row * singerHeight;
    for(var col = 0; col < numsingercols; col++){
        var x = col * singerWidth;
        if(row % 2 == 0){
            x = x+ Math.floor(singerWidth / 2);
        }
        singerspots[spoti] = [x,y];
        spoti++;
    }
}
// create the order of spots


var singerimages = [
    // open-mouth image first.
    ["images/JPActiveOpen160.png","images/JPActive160.png"],
    ["images/JewelActiveOpen160.png","images/JewelActive160.png"]

]

$(function() {

    screenwidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    screenheight = (window.innerHeight > 0) ? window.innerHeight : screen.height;
    
    /*
    setInterval(function(){
        $(".time2").text(Math.floor(correctedNow() / 1000));

    },10);
    */

    console.log("starting");

    // chnage this depending on location of webserver. Figure out a way to make this more dynamic...
    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,"");
    // remove port
    console.log(host);


    $(".play").on("click", function(){

        if(started){
            // shuffle the instrument choices.
            setupChannelPrograms();
            return;
        }
        console.log("starting");
        started = true;

        let now = correctedNow();
        let data = {clienttime: now, uniqID: uniqID};
        message("memberstart", data);
        
        JZZ.synth.Tiny.register('Web Audio');
        tinysynth = JZZ().openMidiOut('Web Audio');

    });

    ws = new WebSocket('ws://'+host+':'+WEBSOCKET_PORT);

    // Browser WebSockets have slightly different syntax than `ws`.
    // Instead of EventEmitter syntax `on('open')`, you assign a callback
    // to the `onopen` property.
    ws.onopen = function() {
        wsready = true;
        console.log("opened " + ws.readyState);
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
    //    console.log("got message ", event);
     //   midiMakeNote(64, 127, 500);
        msg = JSON.parse(event.data);

        if(msg.address == "playnote"){
            midiMakeNote(msg.data.pitch, msg.data.velocity, msg.data.duration)
        }

        if(msg.address == "servertime"){
            processServerTime(msg);
        }

        if(msg.address == "startplaying"){
            console.log("startingplaing", msg.data);
            startMidiFile(msg.data.starttime);
        }

        if(msg.address == "yourchannels"){
            // getting the list of channels for this player
            console.log("yourchannels", msg);
            updateChannels(msg.data.channelList, msg.data.allChannels);
        }
        if(msg.address == "raddecupdate"){
            // getting the list of channels for this player
    //        console.log("raddecupdate", msg.data);
            updateRaddecs(msg.data);
        }
        if(msg.address == "dynambupdate"){
            updateDynambs(msg.data);
        }

        // add message about adding a new instrument here
    }

});




function message(address, data){

    let msg = {address : address,
        data: data};  

    console.log("sending message ", address, msg);
    if(wsready){
    //    var buf = new Buffer.from(JSON.stringify(msg));
        ws.send(JSON.stringify(msg));
    }else{
        console.log("ws not ready");
    }
}


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
    console.log("load", name, starttime);
    try {
//        player = JZZ.MIDI.SMF(data).player();
        player = JZZ.MIDI.SMF(data).player();
        player.connect(tinysynth);
        player.connect(function(msg) {
            midievent(msg);
        });      
        player.onEnd = function() {
            console.log("sending song over");
            playing = false;
            message("songover", true);
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
    /*
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
    */

    if(midievent.isNoteOn()){
//        console.log("on", midievent.getChannel(), midievent.getNote());
        graphicsNoteOn(midievent.getChannel());
    }
    if(midievent.isNoteOff()){
   //     console.log("off", midievent.getChannel(), midievent.getNote());
        graphicsNoteOff(midievent.getChannel());
    }

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
    console.log("updateChannels", _myChannels);
    myChannels = _myChannels;
    allChannels = _allchannels;
    if(playing){
        setupChannelVolumes();
    }
    $(".channels").text(JSON.stringify(myChannels, null , "  "));
    graphicsChannelSetup(myChannels, allChannels);
}

function setupChannelPrograms(){
    tinysynth.program(0, Math.floor(Math.random()* 120));
    tinysynth.program(1, Math.floor(Math.random()* 120));
    tinysynth.program(2, Math.floor(Math.random()* 120));
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


// GRAPHICS stuff
let raddecElems = {};

function setupGraphics(){

}
function updateRaddecs(raddecs){
    // update graphics here. 
    for(let i = 0; i < raddecs.length; i++){
        let raddec = raddecs[i];
        let star = false;
        if(!raddecElems[raddec.transmitterId]){
            star = document.createElement("p");
            star.innerText = "⭐";
            star.style.position = "absolute";
            star.style.top = Math.floor(Math.random() * screenheight)+"px";
            star.style.left = Math.floor(Math.random() * screenwidth)+"px";
            document.body.appendChild(star);
            raddecElems[raddec.transmitterId] = star;
        }else{
         //   console.log(raddec.transmitterId, "already exists")
            star = raddecElems[raddec.transmitterId];
        }
     //   console.log(raddecElems);
//        let scaledrssi = dynScale(raddec.rssi, .2, 1);
        let scaledTiming = dynScale(raddec.rssi, .5, 5);
//        star.style.opacity = scaledrssi;
        star.style.animation =  "customAni "+scaledTiming+"s ease 0s infinite normal none";

    }
}


let channelVoiceElems = {};
let dynambicons = false;
let channeldynambs = {};// tracking which channels have which dynambs already.

function gatherDynambs(data){
    console.log("gatehr" , data);
    
    // put dynamb data into something a bit easier to manage
    let dynambs = data.dynambs;
    let dynamblist = [];
    let dynambkeys = Object.keys(dynambs);
    let numdynambkeys = dynambkeys.length;
    let iconKeys = Object.keys(data.dynambicons);
    for (let i = 0; i<numdynambkeys; i++){
        let dynamb = dynambs[dynambkeys[i]];
        console.log(dynamb);
        let thisdynambkeys = Object.keys(dynamb.data);
        thisdynambkeys = thisdynambkeys.filter(d=>iconKeys.includes(d));
        for(let j = 0; j < thisdynambkeys.length; j++){
            dynamblist.push({
                    id: dynamb.deviceId,
                    text: thisdynambkeys[j],
                    icon: data.dynambicons[thisdynambkeys[j]] });
        }
    }
    return dynamblist;
}

function updateDynambs(data){
    let dynamblist = gatherDynambs(data);
    console.log(dynamblist);
    let dynambicons = data.dynambicons;
    let channelkeys = Object.keys(channelVoiceElems);
    let numchannels = channelkeys.length;
    if(numchannels == 0 || dynamblist.length == 0){
        return;
    }
    let di = 0;
    let ci = 0;
    for(let i = 0; i < numchannels; i++){
        let channelelem = channelVoiceElems[channelkeys[i]];
        channelelem[0].dynambs = [];
    }
    while(di < dynamblist.length || ci < numchannels){
        let dynamb = dynamblist[di % dynamblist.length];
        let channelelem = channelVoiceElems[channelkeys[ci % numchannels]];
//        console.log(channelelem);
        channelelem[0].dynambs.push(dynamb);
        di++;
        ci++;
    }
    graphicsPlaceDynambs(dynamblist);
}

function graphicsPlaceDynambs(dynamblist){
    console.log("graphicsPlaceDynambs");

    let channelkeys = Object.keys(channelVoiceElems);
    let numchannels = channelkeys.length;

    for(let i = 0; i < numchannels; i++){
        let channelelem = channelVoiceElems[channelkeys[i]];
        let singer = channelelem[0];
        if(!singer.iconlist){
            singer.iconlist = [];
        }
        let singerdynambs = singer.dynambs;
        let singerleft = parseInt(singer.style.left.replace("px",""));
        let singertop = parseInt(singer.style.top.replace("px",""));

        for(let j = 0; j < singerdynambs.length; j++){
            let singerdynamb = singerdynambs[j];
            console.log(singerdynamb);
            let iconid = "icon"+singerdynamb.id+singerdynamb.text;
            if(singer.iconlist.includes(iconid)){
                continue;
            }
            singer.iconlist.push(iconid);
            let singercenterx = Math.floor(
                singerleft + (singerWidth / 2)
                );
            let singercentery = Math.floor(
                singertop + (singerHeight / 2)
                )
            let sposx = singercenterx
                + Math.floor(
                        (Math.random() * singerWidth)
                        - (singerWidth / 2) 
                    );
            let sposy = singercentery
                + Math.floor(
                        (Math.random() * singerHeight)
                        - (singerHeight / 2) 
                    );                    
            dynambicon = singerdynamb.icon;
            iconelem = document.createElement("p");
            iconelem.classList.add("dynambicon");
            iconelem.setAttribute("id",iconid);
            iconelem.innerText = dynambicon;
            iconelem.style.position = "absolute";
            iconelem.style.left = sposx;
            iconelem.style.top = sposy;
//            let transform = singercenterx+"px "+singercentery+"px";
            let transform = (singercenterx - sposx).toString()+"px "+(singercentery - sposy).toString()+"px";
            console.log("transform", singercenterx, singercentery, sposx, sposy, singerleft, singertop, transform);
            iconelem.style["transform-origin"] = transform;
            console.log("dynambicon", dynambicon, singerWidth, singerHeight, singerleft, singertop, singer.style.left, singer.style.top, sposx, sposy);

            document.body.appendChild(iconelem);            
            
        }
    }
}

function graphicsChannelSetup(channelList, allChannels){
    console.log(channelList);
    let singerindex = 0;
    for(let i = 0; i < channelList.length; i++){
        let channel = channelList[i];
        singerimage = singerimages[singerindex % singerimages.length];
        singer = [];
        singer[0]= document.createElement("img");
        singer[1]= document.createElement("img");
        singer[0].setAttribute("src", singerimage[0]);
        singer[1].setAttribute("src", singerimage[1]);
        singer[0].setAttribute("width", singerWidth);
        singer[1].setAttribute("width", singerWidth);
        /*
        singer = document.createElement("p");
        singer.innerText = "😐";
        */
        singer[0].classList.add("singer");
        singer[1].classList.add("singer");
        singer[0].style.position = "absolute";
        singer[1].style.position = "absolute";

//        let posleft =  Math.floor(Math.random() * singerSafeScreenWidth)+"px"; 
//        let postop = Math.floor(Math.random() * singerSafeScreenHeight)+"px";
//        let posleft =  Math.floor( singerSafeScreenWidth / 2) - (singerWidth / 2)+"px"; 
//        let postop = Math.floor(singerSafeScreenHeight / 2) - (singerHeight / 2)+"px";

        let posleft = singerspots[singerspotorder[singerindex]][0];
        let postop = singerspots[singerspotorder[singerindex]][1];

  
        singer[0].style.top = postop;
        singer[1].style.top = postop;
        singer[0].style.left = posleft;
        singer[1].style.left = posleft;


        document.body.appendChild(singer[0]);
        document.body.appendChild(singer[1]);
        channelVoiceElems[channel] = singer;

        singerindex++;
        
    }
}

let channelsOn = {};
let  mouths = 0;
function graphicsNoteOn(channel){
//    console.log("on", channel);
    mouths++;
//    console.log("on m", mouths);

    if(!channelsOn[channel]){
        channelsOn[channel] = true;            
//        if(channelVoiceElems[channel].innerText != "😮"){
        if(channelVoiceElems[channel][1].style.display != "none"){
            channelVoiceElems[channel][1].style.display = "block";

//            channelVoiceElems[channel].innerText = "😐";
            setTimeout(function(){
                channelVoiceElems[channel][1].style.display = "none";

//                channelVoiceElems[channel].innerText = "😮";
            }, 25);
        }
    }
}
function graphicsNoteOff(channel){
  //  console.log("off", channel);
    channelsOn[channel] = false;     
    mouths--;       
//    channelVoiceElems[channel].innerText = "😐";
    channelVoiceElems[channel][1].style.display = "block";

}



let scalemin = 1000;
let scalemax = -10000;
function dynScale(input, outmin, outmax){
    if(input > scalemax){
        scalemax = input;
    }
    if(input < scalemin){
        scalemin = input;
    }
    let inrange = scalemax - scalemin;
    let outrange = outmax - outmin;

    let scalefactor = outrange / inrange;
    let diff = input - scalemin;
    let difffraction = diff / inrange;
    let output = difffraction * outrange + outmin;
//    console.log(input, scalemin, scalemax,output );

    return output


}