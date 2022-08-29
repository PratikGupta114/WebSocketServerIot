import express from "express";
import { createServer, IncomingMessage } from "http";
import { createClient } from "redis";
import internal from "stream";
import { WebSocket } from "ws";
import { appConfiguration } from "./config";
import { activeConnections } from "./data/ConnectionsDataService";
import { createWebsocketConnectionsMetricDescriptor, getInstanceNameIDAndZone, updateWebsocketConnectionsMetricDescriptor } from "./data/Monitoring";
import { ClientConnectionRecord, MetaData } from "./data/Types";
import { onPongReceiveHandler, onWebSocketCloseHandler, sendPings } from "./websockets/ConnectionControlHandlers";
import { broadCastToLocalClients, onWebSocketMessageHandler } from "./websockets/MessageHandlers";
import path = require("path");

const app = express();
const httpServer = createServer(app);

var TempMetaData: MetaData = {
    lastPongReceived: 0,
    pathName: "",
    deviceID: ""
};

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
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'))
});

app.use(express.static(path.join(__dirname, '../', 'client-fe')))
app.use('/home', (req, res, next) => {
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'))
})

// courtesy - https://github.com/websockets/ws/issues/517#issuecomment-134994157
const httpUpgradeHandler = async (request: IncomingMessage, socket: internal.Duplex) => {

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

    TempMetaData = {
        deviceID: deviceID as string,
        lastPongReceived: new Date().getTime(),
        pathName: pathName as string,
    };

    let str = await client.get(deviceID!);

    if (str) {

        let connectionRecord: ClientConnectionRecord = JSON.parse(str);
        if (connectionRecord) {
            console.error("Device with ID :", deviceID, " is already connected");
            socket.destroy();
            return;
        }

    } else {
        console.log("Connection record does not exist hence creating record");
        // connectionRecord object is null fetch the instance name and instance ID

        let connectionRecord: ClientConnectionRecord = {
            instanceID: "NA",
            instanceName: "NA",
            connectedPath: pathName,
            lastPongReceived: new Date().getTime(),
        };

        if (appConfiguration.buildType !== "development") {
            // fetch the instance name and id from the function
            const { instanceId, instanceName } = await getInstanceNameIDAndZone();
            // Since the object is null, hence create the object
            connectionRecord.instanceID = instanceId;
            connectionRecord.instanceName = instanceName;
        }

        // Now that we have the object ready, push it to the redis cache
        await client.set(deviceID!, JSON.stringify(connectionRecord));
    }
}

httpServer.on("upgrade", httpUpgradeHandler);

const webSocketServer = new WebSocket.Server({
    server: httpServer
});

const validPaths = [
    "/echo",
    "/post",
    "/record"
];

webSocketServer.on("connection", (ws, request) => {

    const metaData: MetaData = {
        lastPongReceived: TempMetaData.lastPongReceived,
        pathName: TempMetaData.pathName,
        deviceID: TempMetaData.deviceID,
    };

    console.log(`On new connection with device : ${metaData.deviceID} for path ${metaData.pathName}`);
    const tempData = JSON.parse(JSON.stringify(metaData));
    console.log(tempData);
    // If this works add the above three as metaData 
    activeConnections.set(ws, tempData);

    TempMetaData.deviceID = "";
    TempMetaData.pathName = "";
    TempMetaData.lastPongReceived = 0;

    ws.on("message", (data, isBinary) => onWebSocketMessageHandler(ws, data, isBinary));
    ws.on("close", (code, number) => onWebSocketCloseHandler(ws, code, number));
    ws.on("pong", (data: Buffer) => onPongReceiveHandler(ws, data));
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


