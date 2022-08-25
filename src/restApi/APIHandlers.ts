
import express from "express"
import { IncomingMessage } from "http";
import internal from "stream";
import { activeConnections } from "../data/ConnectionsDataService"
import { MetaData } from "../data/Types"
import { appConfiguration } from "../config";

const validPaths = [
    "/echo",
    "/post",
    "/record"
];

// courtesy - https://github.com/websockets/ws/issues/517#issuecomment-134994157
export const httpUpgradeHandler = (request: IncomingMessage, socket: internal.Duplex) => {

    // This is a small hack to reconstruct the websocket url since the request.url 
    const url = new URL(`wss://${appConfiguration.host}:${appConfiguration.port}${request.url}`);
    const params = url.searchParams;
    const pathName = url.pathname;
    const deviceID = params.get("deviceID");

    console.log(`Upgrade request from ${deviceID} for ${pathName}`);

    // Validate the deviceID, macID and the pathName 
    if (!deviceID || !validPaths.includes(pathName)) {
        console.error("Connection request denied due to lack of meta data");
        socket.destroy();
    }

    // Check if a device with the same macID is already connected.
    for (const metaData of activeConnections.values()) {
        if (metaData.deviceID === deviceID) {
            console.error("Device with ID :", deviceID, " is already connected");
            socket.destroy();
            return;
        }
    }

    // connection accepted, pass the information to the next callback.
    const metaData: MetaData = {
        pathName: pathName as string,
        deviceID: deviceID as string,
        lastPongReceived: (new Date().getTime()),
    };
    (request as any).customMetaData = metaData;
}

export const activeConnectionsRequestHandler = (req: express.Request, res: express.Response) => {

    const connections = [...activeConnections.keys()];

    if (connections.length <= 0) {
        res.status(200).send({
            "message": "No active connections yet",
            "count": 0,
            "connections": undefined
        });
        return;
    }

    const connectionList = [];

    for (const connection of connections) {
        const metaData = activeConnections.get(connection);
        connectionList.push({
            ...metaData,
            url: connection.url
        });
    }

    res.header('access-control-allow-origin', '*')
    res.status(200).send({
        "message": "Connections fetch success",
        "count": connectionList.length,
        "connections": connectionList
    });
    return;
};