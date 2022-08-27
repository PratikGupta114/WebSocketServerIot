"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = exports.client = void 0;
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const config_1 = require("./config");
const ConnectionsDataService_1 = require("./data/ConnectionsDataService");
const redis_1 = require("redis");
const MessageHandlers_1 = require("./websockets/MessageHandlers");
const ConnectionControlHandlers_1 = require("./websockets/ConnectionControlHandlers");
const APIHandlers_1 = require("./restApi/APIHandlers");
const Monitoring_1 = require("./data/Monitoring");
const path = require("path");
const Types_1 = require("./data/Types");
const rxjs_1 = require("rxjs");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
exports.client = (0, redis_1.createClient)({
    socket: {
        host: config_1.appConfiguration.redisHost,
        port: config_1.appConfiguration.redisPort
    }
});
exports.subscriber = exports.client.duplicate();
(async () => {
    try {
        exports.client.on("error", (err) => {
            console.error(`Error while connecting to redis cache : ${err}`);
        });
        await exports.client.connect();
        await exports.subscriber.connect();
        await exports.subscriber.subscribe("broadcast", (message) => {
            (0, MessageHandlers_1.broadCastToLocalClients)(message);
        });
    }
    catch (error) {
        console.error(error);
    }
    console.log("Connected to Redis Sever with host : ", config_1.appConfiguration.redisHost, " and port : ", config_1.appConfiguration.redisPort);
})();
app.get("/", (req, res) => {
    // res.status(200).send({
    //     "message": "Hello World"
    // });
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'));
});
// app.get("/activeConnections", activeConnectionsRequestHandler);
app.use(express_1.default.static(path.join(__dirname, '../', 'client-fe')));
app.use('/home', (req, res, next) => {
    res.status(200).sendFile(path.join(__dirname, '../', 'client-fe', 'index.html'));
});
httpServer.on("upgrade", APIHandlers_1.httpUpgradeHandler);
const webSocketServer = new ws_1.default.Server({
    server: httpServer
});
webSocketServer.on("connection", (ws, request) => {
    Types_1.tempMetaData.pipe((0, rxjs_1.takeLast)(1)).subscribe((metaData) => {
        console.log(`On new connection with device : ${metaData.deviceID} for path ${metaData.pathName}`);
        const tempData = JSON.parse(JSON.stringify(metaData));
        console.log(tempData);
        // If this works add the above three as metaData 
        ConnectionsDataService_1.activeConnections.set(ws, tempData);
        ws.on("message", (data, isBinary) => (0, MessageHandlers_1.onWebSocketMessageHandler)(ws, data, isBinary));
        ws.on("close", (code, number) => (0, ConnectionControlHandlers_1.onWebSocketCloseHandler)(ws, code, number));
        ws.on("pong", (data) => (0, ConnectionControlHandlers_1.onPongReceiveHandler)(ws, data));
    });
});
httpServer.listen(config_1.appConfiguration.port, () => {
    console.log(`App is now listening to ${config_1.appConfiguration.port}`);
});
setInterval(ConnectionControlHandlers_1.sendPings, config_1.appConfiguration.pingIntervalMillis);
if (config_1.appConfiguration.buildType !== "development") {
    // Once the server is up and runnning, make an attempt to create the metric
    console.log("Not running in development mode", config_1.appConfiguration.buildType);
    try {
        (async () => await (0, Monitoring_1.createWebsocketConnectionsMetricDescriptor)())();
        console.log("Successfully created metric");
    }
    catch (err) {
        console.error(err);
    }
    setInterval(async () => {
        try {
            console.log("Curernt web socket clients : ", webSocketServer.clients?.size);
            await (0, Monitoring_1.updateWebsocketConnectionsMetricDescriptor)(webSocketServer.clients?.size || 0, config_1.appConfiguration.port);
            console.log("Successfully updated metric");
        }
        catch (error) {
            console.error(error);
        }
    }, config_1.appConfiguration.connectionMetricUpdateIntervalMillis);
}
