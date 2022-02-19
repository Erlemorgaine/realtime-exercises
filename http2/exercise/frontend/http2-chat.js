const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator");

// this will hold all the most recent messages
let allChat = [];

chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  const data = {
    user,
    text,
  };

  // request options
  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  // send POST request
  // we're not sending any json back, but we could
  await fetch("/msgs", options);
}

async function getNewMsgs() {
  let reader;
  const utf8Decoder = new TextDecoder("utf-8");

  try {
    const res = await fetch("/msgs");

    // This will assign a readable text stream, that you can continuously get stuff back from
    // (since it's a stream). If connection would close, we would use json parser, since that waits until incoming stuff is finished
    reader = res.body.getReader(); 
  } catch (e) {
    console.log(e)
  }

  // Ctrl + cmd + space brings up emoji picker
  // presence = button thing in top right of UI
  presence.innerText = '🐸';

  let readerResponse;
    let done;

  do { 
    try {
      // This thing waits until API sends something new back
      readerResponse = await reader.read();
    } catch (e) {
      console.log(e)
      presence.innerText = '👹';
      return;
    }

    const chunk = utf8Decoder.decode(readerResponse.value, { stream: true })

    // This would become true if server connection closes. In reality for us it never closes
    done = readerResponse.done;

    try {
      const json = JSON.parse(chunk);
      allChat = json.msg;
      render();
    } catch (e) {
      console.error("parse error", e);
    }

  } while (!done) // Done should never be true as long as connection is open
  
  presence.innerText = '👹';
}

function render() {
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

getNewMsgs();
