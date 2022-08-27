"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadCastToLocalClients = exports.onWebSocketMessageHandler = void 0;
const ConnectionsDataService_1 = require("../data/ConnectionsDataService");
const util_1 = require("util");
const onWebSocketMessageHandler = (ws, message, isBinary) => {
    const metaData = ConnectionsDataService_1.activeConnections.get(ws);
    // Check if the metadata is avaialble for the present connection
    if (!metaData) {
        console.log("Invalid Connection");
        return;
    }
    const buffer = new Uint8Array(message.slice(0, undefined));
    let stringMessage = new util_1.TextDecoder("utf-8").decode(buffer);
    // Null safety guard
    if (!metaData) {
        console.error("Metadata for this connection was not found");
        return;
    }
    ;
    console.log("Message Received : ", stringMessage);
    metaData.lastPongReceived = new Date().getTime();
    ConnectionsDataService_1.activeConnections.set(ws, metaData);
    if (metaData.pathName == "/echo") {
        // Echo server, send the data back to the client
        if (stringMessage === "jinne mera dil luteya" || stringMessage === "jinne menu maar suteya") {
            ws.send("Ohho", { binary: false });
        }
        else {
            ws.send(stringMessage, { binary: false });
        }
    }
    else if (metaData.pathName == "/post") {
    }
    else if (metaData.pathName == "/record") {
    }
};
exports.onWebSocketMessageHandler = onWebSocketMessageHandler;
const broadCastToLocalClients = (message) => {
    [...ConnectionsDataService_1.activeConnections.keys()].forEach(ws => {
        ws.send(message, { binary: false });
    });
};
exports.broadCastToLocalClients = broadCastToLocalClients;
