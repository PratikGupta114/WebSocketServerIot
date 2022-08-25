const card_dec_api = "http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1"
const card_get_api = "http://deckofcardsapi.com/api/deck/"
const ws_server_api = "localhost:3001"
// const ws_server_api = "34.160.199.195:80"

const deviceID_auto = Math.random().toString(16).substr(2, 8);
let socket = new WebSocket(`ws://${ws_server_api}/echo?deviceID=${deviceID_auto};&pathName=test;&lastPongReceived=0;`);

socket.onopen = function (e) {
  alert("[open] Connection established");
};

socket.onmessage = function (event) {
  alert(`[message] Data received from server: ${event.data}`);
};

socket.onclose = function (event) {
  if (event.wasClean) {
    alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    alert('[close] Connection died');
  }
};

socket.onerror = function (error) {
  alert(`[error] ${error.message}`);
};

var selectedCard;

function selectCard() {
  document.getElementById("loader-container").style.display = "block";
  fetch(card_dec_api).then(function (response) {
    return response.json();
  }).then(function (data) {
    fetch(card_get_api + `${data.deck_id}/draw/?count=1`).then(function (response) {
      return response.json();
    }).then(function (data) {
      document.getElementById("loader-container").style.display = "none";
      selectedCard = data.cards[0];
      document.getElementById("selected-card").innerHTML = selectedCard.value + " of " + selectedCard.suit;
      document.getElementById("selected-card-img").src = selectedCard.image;
      document.getElementById("select-button").innerText = "Select Another Card";
      document.getElementById("send-button").disabled = false;
      console.log(selectedCard);
    }).catch(function () {
      console.log("No Cards for you, Please re-shuffle");
    });
  }).catch(function () {
    console.log("No Deck for you, Please re-shuffle");
  });
}

function sendCard() {
  // alert("card sent " + selectedCard.code);
  socket.send(selectedCard.code);
  document.getElementById("send-button").disabled = true;
  selectedCard = null;
}

function getActiveConnections() {
  const options = {
    method: 'GET',
    mode: 'no-cors'
  };
  fetch(`http://${ws_server_api}/activeConnections`, options).then(function (response) {
  console.log(response)  
  return response.body ? response.body.json() : null;
  }).then(function (data) {
    console.log(data)
  })
}