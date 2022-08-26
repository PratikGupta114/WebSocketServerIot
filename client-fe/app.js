// card deck api
const card_dec_api = "http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1"
const card_get_api = "http://deckofcardsapi.com/api/deck/"

// get current api to connect to WS and get active connections
const ws_server_api = (window.location.href).replace("http://", '').replace("/", '')

const deviceID_auto = Math.random().toString(16).substr(2, 8);
let socket = new WebSocket(`ws://${ws_server_api}/echo?deviceID=${deviceID_auto}`);

socket.onopen = function (e) {
  document.getElementById("deviceID").innerHTML = "Device ID:" + deviceID_auto + ""
  alert("[open] Connection established with device id: " + deviceID_auto);
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
      document.getElementById("select-button").disabled = true;
      document.getElementById("send-button").disabled = false;
    }).catch(function () {
      document.getElementById("deviceID").innerHTML = "No Cards for you, Please re-shuffle";
    });
  }).catch(function () {
    document.getElementById("deviceID").innerHTML = "No Deck for you, Please re-shuffle";
  });
}

function sendCard() {
  socket.send(selectedCard.code);
  document.getElementById("send-button").disabled = true;
  selectedCard = null;
}

function getActiveConnections() {
  fetch(`http://${ws_server_api}/activeConnections`).then(function (response) {
    return response.text();
  }).then(function (data) {
    data = JSON.parse(data)
    document.getElementById("list").innerHTML = ''
    data.connections.forEach(function (connection) {
      document.getElementById("list").innerHTML = document.getElementById("list").innerHTML + "<br>" + connection.deviceID.replace(';', '')
    })
  })
}