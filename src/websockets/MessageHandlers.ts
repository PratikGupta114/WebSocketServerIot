import WebSocket from "ws";
import { activeConnections } from "../data/ConnectionsDataService";
import { TextDecoder } from "util";

export const onWebSocketMessageHandler: (ws: WebSocket.WebSocket, message: WebSocket.RawData, isBinary: boolean) => void = (ws, message, isBinary) => {

    const metaData = activeConnections.get(ws);

    // Check if the metadata is avaialble for the present connection
    if (!metaData) { console.log("Invalid Connection"); return; }

    const buffer = new Uint8Array(message.slice(0, undefined) as ArrayBuffer);
    let stringMessage = new TextDecoder("utf-8").decode(buffer);

    // Null Check
    if (!metaData) {
        console.error("Metadata for this connection was not found");
        return;
    };

    console.log("Message Received : ", stringMessage);

    metaData.lastPongReceived = new Date().getTime();
    activeConnections.set(ws, metaData);

    if (metaData.pathName == "/echo") {
        // Echo server, send the data back to the client
        if (stringMessage === "jinne mera dil luteya" || stringMessage === "jinne menu maar suteya") {
            ws.send("Ohho", { binary: false });
        } else {
            ws.send(stringMessage, { binary: false });
        }
    }
    else if (metaData.pathName == "/post") {
        // add if needs to be handled
    }
    else if (metaData.pathName == "/record") {
        // add if needs to be handled
    }
};

export const broadCastToLocalClients: (message: string) => void = (message) => {
    [...activeConnections.keys()].forEach(ws => {
        ws.send(message, { binary: false });
    })
}