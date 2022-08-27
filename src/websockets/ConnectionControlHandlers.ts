import WebSocket from "ws";
import { client } from "../index";
import { appConfiguration } from "../config";
import { activeConnections } from "../data/ConnectionsDataService";
import { ClientConnectionRecord, MetaData } from "../data/Types";


export const onWebSocketCloseHandler: (ws: WebSocket.WebSocket, code: number, reason: Buffer) => void = (ws, code, reason) => {
    const metaData = activeConnections.get(ws);
    if (!!metaData) {
        console.log(`Device : ${metaData.deviceID} has been disconnected.Code : ${code} } reason: ${reason} `);
        activeConnections.delete(ws);
        // remove the data from the redis cache
        (async () => await client.del(metaData.deviceID))();
    }
};

export const onPongReceiveHandler: (ws: WebSocket.WebSocket, data: Buffer) => void = (ws, data) => {

    // console.log("On Pong received !");

    if (!activeConnections.has(ws)) {
        console.error("This websocket connection is not present in the active connections map");
        return;
    }
    const metaData: MetaData = activeConnections.get(ws)!;
    metaData.lastPongReceived = new Date().getTime();
    activeConnections.set(ws, metaData);

    (async () => {
        const str = await client.get(metaData.deviceID!) as string;
        const connectionRecord: ClientConnectionRecord = JSON.parse(str);
        connectionRecord.lastPongReceived = metaData.lastPongReceived
        await client.set(metaData.deviceID!, JSON.stringify(connectionRecord));
    })();

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
