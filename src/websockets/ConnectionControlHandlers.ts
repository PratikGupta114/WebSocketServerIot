import WebSocket from "ws";
import { appConfiguration } from "../config";
import { activeConnections } from "../data/ConnectionsDataService";
import { MetaData } from "../data/Types";


export const onWebSocketCloseHandler: (ws: WebSocket.WebSocket, code: number, reason: Buffer) => void = (ws, code, reason) => {
    const metaData = activeConnections.get(ws);
    if (!!metaData) {
        console.log(`Device : ${metaData.deviceID} has been disconnected.Code : ${code} } reason: ${reason} `);
        activeConnections.delete(ws);
    }
};

export const onPongReceiveHandler: (ws: WebSocket.WebSocket, data: Buffer) => void = (ws, data) => {
    if (!activeConnections.has(ws)) {
        console.error("This websocket connection is not present in the active connections map");
        return;
    }
    const metaData: MetaData = activeConnections.get(ws)!;

    metaData.lastPongReceived = new Date().getTime();
    activeConnections.set(ws, metaData);

};

// Courtesy - https://github.com/websockets/ws/issues/686#issuecomment-254173831
export const sendPings = () => {
    // console.log("Sending Pings ...");
    [...activeConnections.keys()].forEach(ws => {
        const metaData: MetaData = activeConnections.get(ws)!;

        if ((new Date().getTime()) - metaData.lastPongReceived > appConfiguration.connectionTimeoutDurationMillis) {
            console.log(`pong timeout for ${metaData.deviceID} has elapsed. Hence closing connection`);
            (ws as any)._socket.destroy();
            activeConnections.delete(ws);
        }
        if (ws.readyState === 1) {
            ws.ping('.', false);
        }
    });
}
