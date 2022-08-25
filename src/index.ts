import { createServer } from "http";
import express, { request } from "express";
import WebSocket from "ws";
import { createClient } from "redis"

import { appConfiguration } from "./config";
import { MetaData } from "./data/Types";
import { activeConnections } from "./data/ConnectionsDataService";
import { onWebSocketMessageHandler } from "./websockets/MessageHandlers";
import { onPongReceiveHandler, onWebSocketCloseHandler } from "./websockets/ConnectionControlHandlers";
import { activeConnectionsRequestHandler, httpUpgradeHandler } from "./restApi/APIHandlers";


const app = express();
const httpServer = createServer(app);
const redisClient = createClient();

app.get("/", (req, res) => {
    res.status(200).send({
        "message": "Hello World"
    });
});

app.get("/activeConnections", activeConnectionsRequestHandler);

httpServer.on("upgrade", httpUpgradeHandler);

const webSocketServer = new WebSocket.Server({
    server: httpServer
});

webSocketServer.on("connection", (ws, request) => {
    // extract the values from the request object
    const metaData = (request as any).customMetaData as MetaData;
    console.log(`On new connection with device : ${metaData.deviceID
        } for path ${metaData.pathName
        }`);

    // If this works add the above three as metaData 
    activeConnections.set(ws, metaData);

    ws.on("message", (data, isBinary) => onWebSocketMessageHandler(ws, data, isBinary));
    ws.on("close", (code, number) => onWebSocketCloseHandler(ws, code, number));
    ws.on("pong", (data: Buffer) => onPongReceiveHandler(ws, data));
});

httpServer.listen(appConfiguration.port, () => {
    console.log(`App is now listening to ${appConfiguration.port}`);
});