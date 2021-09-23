import socketClient from "socket.io-client";

const socket = socketClient("ws://localhost:8080", {
  transports: ["websocket"],
});

export { socket }