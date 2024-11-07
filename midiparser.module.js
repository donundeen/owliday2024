
// turn this into a module
// it needs to generate a series of noteOn/noteOff messages with aboslute times,
// with assumption that score start X seconds in the future.
// also w option to add other, non-midi messages

let file = "./Christmas_Carols_-_12_Days_Of_Christmas.mid";


let midiParser  = require('midi-parser-js');
let fs = require('fs');

let data = fs.readFileSync(file);
let midiArray = midiParser.parse(data);

console.log(`Tracks: ${midiArray.tracks}, TimeDivision: ${midiArray.timeDivision}`);
for(let i in midiArray.track) {
  console.log(`Track ${i}`);
  let curTime = 0;
  for(let j in midiArray.track[i].event) {
    let event = midiArray.track[i].event[j];
      curTime = curTime + event.deltaTime;
      midiArray.track[i].event[j].absTime = curTime;
  }
}

for(let i in midiArray.track) {
    console.log(`Track ${i}`);
    for(let j in midiArray.track[i].event) {
      let event = midiArray.track[i].event[j];
      switch(event.type) {
        case 8: // note off
          console.log("off ", event);
          break;
        case 9: // note on
            console.log("on ", event);
            break;
        default:
          console.log(j, event);
          break;
        }
    }
}