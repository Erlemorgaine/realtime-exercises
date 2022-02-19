const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

// let's store all current messages here
let allChat = [];
let failedTries = 0;

// the interval to poll at in milliseconds
const INTERVAL = 3000;
const BACKOFF = 5000;

// a submit listener on the form in the HTML
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  const data = { user, text };
  const options = { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } };
  return fetch("/poll", options);
}

// What would be better:
// 1) Calling this immediately every time the user ends a new message
// 2) only get the messages that the user doesn't have yet
async function getNewMsgs() {
  let json;

  try {
    const res = await fetch("/poll");
    json = await res.json();

    // Put this here, since try catch won't throw an error when getting back 500
    if (res.status >= 400) {
      throw new Error('Request did not succeed: ' + res.status);
    }

    allChat = json.msg;
    render();

    // Implement backoff
    failedTries = 0;
  } catch (e) {
    console.error("polling error", e)

    failedTries++;
  }


  // Every time we call the function we set a new timeout, after having executed the above code first!
  // With this method, the calls never stop, also when user is not on tab
  // setTimeout(getNewMsgs, INTERVAL);
}

function render() {
  // as long as allChat is holding all current messages, this will render them
  // into the ui. yes, it's inefficent. yes, it's fine for this example
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

// given a user and a msg, it returns an HTML string to render to the UI
const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

// make the first request
// getNewMsgs();

let timeToMakeNextRequest = 0;
let msOffset = 0;

// Use rAF, to also pause when the user is not focused on this tab (after a little while), and unpause on refocus
// Also, rAF won't half the other processes in your browser, like setTimeout does
async function rAFTimer(time) {
  if (!msOffset) msOffset = Date.now() - time;
  if (timeToMakeNextRequest <= time) {
    await getNewMsgs();
    // Makes sure that next call is fired after the previous one is finished, + the time in INTETVAL
    // Use Date.now() instead of time, since if request takes long, variable time can be behind actual time
    const backoffTime = failedTries * BACKOFF;
    timeToMakeNextRequest = (Date.now() - msOffset) + INTERVAL + backoffTime;
  }

  requestAnimationFrame(rAFTimer);
}

rAFTimer(0);
