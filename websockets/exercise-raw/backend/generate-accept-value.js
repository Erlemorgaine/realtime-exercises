import crypto from "crypto";

// This is basically the handshake between client and server. 
// acceptKey comes from client. 
// We need that particular string 258EAFA5 etc for every websocket
// This is just to make sure that both parties are speaking the same protocol
function generateAcceptValue(acceptKey) {
  return (
    crypto
      .createHash("sha1")
      // this magic string key is actually in the spec
      .update(acceptKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", "binary")
      .digest("base64")
  );
}

export default generateAcceptValue;
