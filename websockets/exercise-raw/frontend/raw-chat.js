const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator");
let allChat = [];

// listen for events on the form
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  const data = { user, text };

  // This is how you post to the server
  ws.send(JSON.stringify(data));
}

// ws stands for websocket protocol, second param says what client knows how to parse / identify
// Server will pick the one it knows too
const ws = new WebSocket("ws://localhost:8080", ["json"]);
ws.addEventListener("open", () => {
  console.log("WS connected");
  presence.innerText = "🐢";
})

// This gets called whenever a message comes back from server
ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  allChat = data.msg;
  render();
});

ws.addEventListener("close", () => {
  presence.innerText = "🍓";
})

function render() {
  const html = allChat.map(({ user, text }) => template(user, text));
  msgs.innerHTML = html.join("\n");
}

const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;
