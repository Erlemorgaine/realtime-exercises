import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";
import { Server } from "socket.io";

const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "brian",
  text: "hi",
  time: Date.now(),
});

// serve static assets
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: "./frontend",
  });
});

const io = new Server(server, {});

io.on("connection", (socket) => {
  console.log("Connected " + socket.id);

  // We can name 'msg:get' however we want.
  // This is an event to which clients can subscribe.
  // You can arrange it so that only some clients can subscribe to it
  socket.emit("msg:get", { msg: getMsgs() });
  
  socket.on("msg:post", data => {
    msg.push({ user: data.user, text: data.text, time: Date.now() });

    // Since you want to broadcast to all sockets, do this on io (which is the server)
    io.emit("msg:get", { msg: getMsgs() });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected " + socket.id);
  });

});

const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
