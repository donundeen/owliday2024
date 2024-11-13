const { io } = require("socket.io-client");

const paretoclient = io("http://10.0.0.200:3001");

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

paretoclient.on("raddec", (raddec) => { console.log("raddec", raddec);});
paretoclient.on("dynamb", (dynamb) => { console.log("dynamb", raddec);});


