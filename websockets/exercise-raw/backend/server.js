import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";

// these are helpers to help you deal with the binary data that websockets use
import objToResponse from "./obj-to-response.js";
import generateAcceptValue from "./generate-accept-value.js";
import parseMessage from "./parse-message.js";

let connections = [];
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

// Websocket on the client asks for an upgrade, hence "upgrade"
// On upgrade:
// - Send existing msgs back to socket
// - Add socket to existing connections
// - Listen to socket to see if data is coming in
// - Push incoming data to all existing sockets
// - If connection closes, remove socket
server.on("upgrade", (req, socket) => {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  const acceptKey = req.headers["sec-websocket-key"];
  const acceptValue = generateAcceptValue(acceptKey);
  const headers = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: Websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
    "Sec-WebSocket-Protocol: json", // Has to correspond with one of the client protocols
    "\r\n", // This is to tell the browser that this is the end of the headers
  ];

  // Write sends something back to the server
  socket.write(headers.join("\r\n")); // join the array to create a large string
  socket.write(objToResponse({ msg: getMsgs() }));

  // Add socket to existing connections
  connections.push(socket)

  // Here the server is "listening" to the client, receiving its requests
  socket.on("data", (buffer) => {
    const message = parseMessage(buffer);

    if (message) {
      msg.push({
        user: message.user,
        text: message.text,
        time: Date.now()
      });
  
      connections.forEach(s => {
        s.write(objToResponse({ msg: getMsgs() }));
      });
    } else if (message === null) {
      // If message is null, we've got an opt code 8, so we should shut down
      socket.end();
    }
  });

  socket.on("end", () => {
    connections = connections.filter(s => s !== socket);
  });
})



const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
