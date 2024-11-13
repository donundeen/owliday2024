const { io } = require("socket.io-client");

const socket = io("http://10.0.0.200:3001");

// client-side
socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx

  });
  
  socket.on("disconnect", () => {
    console.log(socket.id); // undefined
  });

  socket.on("connect_error", (error) => {
    if (socket.active) {
      // temporary failure, the socket will automatically try to reconnect
    } else {
      // the connection was denied by the server
      // in that case, `socket.connect()` must be manually called in order to reconnect
      console.log(error.message);
    }
  });

  socket.on("raddec", (raddec) => { console.log("raddec", raddec);});
  socket.on("dynamb", (raddec) => { console.log("raddec", raddec);});


