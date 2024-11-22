
function processServerTime(msg){
    console.log("processServerTime");
//    let nowTimeStamp = Date.now();
    let nowTimeStamp = correctedNow();
    var clientTimestamp = msg.data.clientnow;    
    let serverTimestamp = msg.data.servernow;
    let responsediff = nowTimeStamp - msg.data.servernow;
    let serverClientRequestDiffTime = msg.data.difference;
    let serverClientResponseDiffTime = nowTimeStamp - serverTimestamp;

    //https://stackoverflow.com/questions/1638337/the-best-way-to-synchronize-client-side-javascript-clock-with-server-date
    var responseTime = (serverClientRequestDiffTime - nowTimeStamp + clientTimestamp - serverClientResponseDiffTime ) / 2
    console.log("responseTime", responseTime);
    // Calculate the synced server time
    console.log("adjusted time ", nowTimeStamp + (serverClientResponseDiffTime - responseTime))
    var syncedServerTime = new Date(nowTimeStamp + (serverClientResponseDiffTime - responseTime)).getTime();
    
    console.log("got server time",  syncedServerTime);

    timeskew = syncedServerTime - nowTimeStamp;

    timeobj = {
        nowTimeStamp : nowTimeStamp,
        clientTimestamp :clientTimestamp,   
        serverTimestamp :serverTimestamp,
        responsediff :responsediff,
        serverClientRequestDiffTime :serverClientRequestDiffTime,
        serverClientResponseDiffTime :serverClientResponseDiffTime,  
        syncedServerTime : syncedServerTime,
        skew: timeskew
    }
    
    console.log(timeobj);    

    $(".dbg").text(JSON.stringify(timeobj, null, "  "));
}
