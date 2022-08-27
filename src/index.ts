import { createServer } from "http";
import express from "express";
import WebSocket from "ws";

import { appConfiguration } from "./config";
import { activeConnections } from "./data/ConnectionsDataService";
import { createClient } from "redis";
import { broadCastToLocalClients, onWebSocketMessageHandler } from "./websockets/MessageHandlers";
import { onPongReceiveHandler, onWebSocketCloseHandler, sendPings } from "./websockets/ConnectionControlHandlers";
import { /* activeConnectionsRequestHandler ,*/ httpUpgradeHandler } from "./restApi/APIHandlers";
import { createWebsocketConnectionsMetricDescriptor, updateWebsocketConnectionsMetricDescriptor } from "./data/Monitoring";
import path = require("path");
import { MetaData, tempMetaData } from "./data/Types";

const app = express();
const httpServer = createServer(app);


export const client = createClient({
    socket: {
        host: appConfiguration.redisHost,
        port: appConfiguration.redisPort
    }
});

export const subscriber = client.duplicate();

(async () => {
    try {
        client.on("error", (err) => {
            console.error(`Error while connecting to redis cache : ${err}`);
        });
        await client.connect();
        await subscriber.connect();

        await subscriber.subscribe("broadcast", (message) => {
            broadCastToLocalClients(message);
        })

    } catch (error) {
        console.error(error);
    }
    console.log("Connected to Redis Sever with host : ", appConfiguration.redisHost, " and port : ", appConfiguration.redisPort);
})();

app.get("/", (req, res) => {
    // res.status(200).send({
    //     "message": "Hello World"
    // });
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'))
});

// app.get("/activeConnections", activeConnectionsRequestHandler);

app.use(express.static(path.join(__dirname, '../', 'client-fe')))
app.use('/home', (req, res, next) => {
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'))
})

httpServer.on("upgrade", httpUpgradeHandler);

const webSocketServer = new WebSocket.Server({
    server: httpServer
});

webSocketServer.on("connection", (ws, request) => {

    tempMetaData.subscribe((metaData) => {
        console.log(`On new connection with device : ${metaData.deviceID
            } for path ${metaData.pathName
            }`);

        // If this works add the above three as metaData 
        activeConnections.set(ws, metaData);

        ws.on("message", (data, isBinary) => onWebSocketMessageHandler(ws, data, isBinary));
        ws.on("close", (code, number) => onWebSocketCloseHandler(ws, code, number));
        ws.on("pong", (data: Buffer) => onPongReceiveHandler(ws, data));
    })
});

httpServer.listen(appConfiguration.port, () => {
    console.log(`App is now listening to ${appConfiguration.port}`);
});

setInterval(sendPings, appConfiguration.pingIntervalMillis);

if (appConfiguration.buildType !== "development") {
    // Once the server is up and runnning, make an attempt to create the metric
    console.log("Not running in development mode", appConfiguration.buildType);

    try {
        (async () => await createWebsocketConnectionsMetricDescriptor())();
        console.log("Successfully created metric");
    } catch (err) {
        console.error(err);
    }

    setInterval(async () => {
        try {
            console.log("Curernt web socket clients : ", webSocketServer.clients?.size);
            await updateWebsocketConnectionsMetricDescriptor(
                webSocketServer.clients?.size || 0,
                appConfiguration.port
            );
            console.log("Successfully updated metric");
        } catch (error) {
            console.error(error);
        }
    }, appConfiguration.connectionMetricUpdateIntervalMillis);
}


