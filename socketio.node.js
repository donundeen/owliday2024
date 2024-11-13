const { io } = require("socket.io-client");

const socket = io("http://localhost:3001");

// client-side
socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });
  
  socket.on("disconnect", () => {
    console.log(socket.id); // undefined
  });

  socket.on("data", () => { console.log("data");});


