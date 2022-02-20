// Here we actually have to manipulate the binary to send the object
// back to the client correctly
export default function objToResponse(obj) {
  const string = JSON.stringify(obj);
  const stringBytes = Buffer.byteLength(string);
  // we're only doing two frames.
  // A frame is 1 packet of data that is being sent / received from browser
  const lengthByteCount = stringBytes < 126 ? 0 : 2;
  const payloadLength = lengthByteCount === 0 ? stringBytes : 126;
  const buffer = Buffer.alloc(2 + lengthByteCount + stringBytes);

  // 0b.... means it's a binary number
  buffer.writeUInt8(0b10000001, 0);
  buffer.writeUInt8(payloadLength, 1);

  let payloadOffset = 2;
  if (lengthByteCount > 0) {
    buffer.writeUInt16BE(stringBytes, 2);
    payloadOffset += lengthByteCount;
  }

  buffer.write(string, payloadOffset);
  return buffer;
}
