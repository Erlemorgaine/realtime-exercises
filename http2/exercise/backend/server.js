// These are all node libraries
import http2 from "http2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import handler from "serve-handler";
import nanobuffer from "nanobuffer";

// Here we keep track of currently connected streams
let connections = [];

const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "brian",
  text: "hi",
  time: Date.now(),
});

// the two commands you'll have to run in the root directory of the project are
// (not inside the backend folder)
//
// openssl req -new -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem
// openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt
//
// http2 only works over HTTPS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = http2.createSecureServer({
  cert: fs.readFileSync(path.join(__dirname, "/../server.crt")),
  key: fs.readFileSync(path.join(__dirname, "/../key.pem")),
});

// Both request and stream will always fire on a browser request: first stream, then request
server.on('stream', (stream, headers) => {
  const path = headers[":path"];
  const method = headers[":method"];

  if (path === '/msgs' && method === "GET") {
    // Immediately respond with status ok & encoding
    console.log('connected a stream ' + stream.id);
    stream.respond({ ":status": 200, "content-type": "text/plain; charset=utf-8" });

    // First response
    stream.write(JSON.stringify({ msg: getMsgs() }));
    connections.push(stream);

    // This happens when connection closes
    stream.on("close", () => {
      console.log("disconnected " + stream.id);
      connections = connections.filter(stream => stream !== stream);
     })
  }
} )

// This time we don't use express, so we have to do a bit more router work ourselves
server.on("request", async (req, res) => {
  const path = req.headers[":path"];
  const method = req.headers[":method"];

  if (path !== "/msgs") {
    // handle the static assets
    return handler(req, res, {
      public: "./frontend",
    });
  } else if (method === "POST") {
    // get data out of post
    // This is essentially what the body parser library does
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    const { user, text } = JSON.parse(data);

    msg.push({ user, text, time: Date.now() })
    res.end();

    // On post, immediately post message to connections
    connections.forEach(stream => stream.write(JSON.stringify({msg: getMsgs()})))
  }
});

// start listening
const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(
    `Server running at https://localhost:${port} - make sure you're on httpS, not http`
  )
);
