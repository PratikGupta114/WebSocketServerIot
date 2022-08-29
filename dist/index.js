"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = exports.client = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const redis_1 = require("redis");
const ws_1 = require("ws");
const config_1 = require("./config");
const ConnectionsDataService_1 = require("./data/ConnectionsDataService");
const Monitoring_1 = require("./data/Monitoring");
const ConnectionControlHandlers_1 = require("./websockets/ConnectionControlHandlers");
const MessageHandlers_1 = require("./websockets/MessageHandlers");
const path = require("path");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
var TempMetaData = {
    lastPongReceived: 0,
    pathName: "",
    deviceID: ""
};
exports.client = (0, redis_1.createClient)({
    socket: {
        host: config_1.appConfiguration.redisHost,
        port: config_1.appConfiguration.redisPort
    }
});
exports.subscriber = exports.client.duplicate();
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        exports.client.on("error", (err) => {
            console.error(`Error while connecting to redis cache : ${err}`);
        });
        yield exports.client.connect();
        yield exports.subscriber.connect();
        yield exports.subscriber.subscribe("broadcast", (message) => {
            (0, MessageHandlers_1.broadCastToLocalClients)(message);
        });
    }
    catch (error) {
        console.error(error);
    }
    console.log("Connected to Redis Sever with host : ", config_1.appConfiguration.redisHost, " and port : ", config_1.appConfiguration.redisPort);
}))();
app.get("/", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'));
});
app.use(express_1.default.static(path.join(__dirname, '../', 'client-fe')));
app.use('/home', (req, res, next) => {
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'));
});
// courtesy - https://github.com/websockets/ws/issues/517#issuecomment-134994157
const httpUpgradeHandler = (request, socket) => __awaiter(void 0, void 0, void 0, function* () {
    // This is a small hack to reconstruct the websocket url since the request.url 
    const url = new URL(`wss://${config_1.appConfiguration.host}:${config_1.appConfiguration.port}${request.url}`);
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
        deviceID: deviceID,
        lastPongReceived: new Date().getTime(),
        pathName: pathName,
    };
    let str = yield exports.client.get(deviceID);
    if (str) {
        let connectionRecord = JSON.parse(str);
        if (connectionRecord) {
            console.error("Device with ID :", deviceID, " is already connected");
            socket.destroy();
            return;
        }
    }
    else {
        console.log("Connection record does not exist hence creating record");
        // connectionRecord object is null fetch the instance name and instance ID
        let connectionRecord = {
            instanceID: "NA",
            instanceName: "NA",
            connectedPath: pathName,
            lastPongReceived: new Date().getTime(),
        };
        if (config_1.appConfiguration.buildType !== "development") {
            // fetch the instance name and id from the function
            const { instanceId, instanceName } = yield (0, Monitoring_1.getInstanceNameIDAndZone)();
            // Since the object is null, hence create the object
            connectionRecord.instanceID = instanceId;
            connectionRecord.instanceName = instanceName;
        }
        // Now that we have the object ready, push it to the redis cache
        yield exports.client.set(deviceID, JSON.stringify(connectionRecord));
    }
});
httpServer.on("upgrade", httpUpgradeHandler);
const webSocketServer = new ws_1.WebSocket.Server({
    server: httpServer
});
const validPaths = [
    "/echo",
    "/post",
    "/record"
];
webSocketServer.on("connection", (ws, request) => {
    const metaData = {
        lastPongReceived: TempMetaData.lastPongReceived,
        pathName: TempMetaData.pathName,
        deviceID: TempMetaData.deviceID,
    };
    console.log(`On new connection with device : ${metaData.deviceID} for path ${metaData.pathName}`);
    const tempData = JSON.parse(JSON.stringify(metaData));
    console.log(tempData);
    // If this works add the above three as metaData 
    ConnectionsDataService_1.activeConnections.set(ws, tempData);
    TempMetaData.deviceID = "";
    TempMetaData.pathName = "";
    TempMetaData.lastPongReceived = 0;
    ws.on("message", (data, isBinary) => (0, MessageHandlers_1.onWebSocketMessageHandler)(ws, data, isBinary));
    ws.on("close", (code, number) => (0, ConnectionControlHandlers_1.onWebSocketCloseHandler)(ws, code, number));
    ws.on("pong", (data) => (0, ConnectionControlHandlers_1.onPongReceiveHandler)(ws, data));
});
httpServer.listen(config_1.appConfiguration.port, () => {
    console.log(`App is now listening to ${config_1.appConfiguration.port}`);
});
setInterval(ConnectionControlHandlers_1.sendPings, config_1.appConfiguration.pingIntervalMillis);
if (config_1.appConfiguration.buildType !== "development") {
    // Once the server is up and runnning, make an attempt to create the metric
    console.log("Not running in development mode", config_1.appConfiguration.buildType);
    try {
        (() => __awaiter(void 0, void 0, void 0, function* () { return yield (0, Monitoring_1.createWebsocketConnectionsMetricDescriptor)(); }))();
        console.log("Successfully created metric");
    }
    catch (err) {
        console.error(err);
    }
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            console.log("Curernt web socket clients : ", (_a = webSocketServer.clients) === null || _a === void 0 ? void 0 : _a.size);
            yield (0, Monitoring_1.updateWebsocketConnectionsMetricDescriptor)(((_b = webSocketServer.clients) === null || _b === void 0 ? void 0 : _b.size) || 0, config_1.appConfiguration.port);
            console.log("Successfully updated metric");
        }
        catch (error) {
            console.error(error);
        }
    }), config_1.appConfiguration.connectionMetricUpdateIntervalMillis);
}
