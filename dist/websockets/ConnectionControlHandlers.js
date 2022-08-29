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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPings = exports.onPongReceiveHandler = exports.onWebSocketCloseHandler = void 0;
const index_1 = require("../index");
const config_1 = require("../config");
const ConnectionsDataService_1 = require("../data/ConnectionsDataService");
const onWebSocketCloseHandler = (ws, code, reason) => {
    const metaData = ConnectionsDataService_1.activeConnections.get(ws);
    if (!!metaData) {
        console.log(`Device : ${metaData.deviceID} has been disconnected.Code : ${code} } reason: ${reason} `);
        ConnectionsDataService_1.activeConnections.delete(ws);
        // remove the data from the redis cache
        (() => __awaiter(void 0, void 0, void 0, function* () { return yield index_1.client.del(metaData.deviceID); }))();
    }
};
exports.onWebSocketCloseHandler = onWebSocketCloseHandler;
const onPongReceiveHandler = (ws, data) => {
    // console.log("On Pong received !");
    if (!ConnectionsDataService_1.activeConnections.has(ws)) {
        console.error("This websocket connection is not present in the active connections map");
        return;
    }
    const metaData = ConnectionsDataService_1.activeConnections.get(ws);
    metaData.lastPongReceived = new Date().getTime();
    ConnectionsDataService_1.activeConnections.set(ws, metaData);
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const str = yield index_1.client.get(metaData.deviceID);
        const connectionRecord = JSON.parse(str);
        if (connectionRecord) {
            connectionRecord.lastPongReceived = metaData.lastPongReceived;
            yield index_1.client.set(metaData.deviceID, JSON.stringify(connectionRecord));
        }
    }))();
};
exports.onPongReceiveHandler = onPongReceiveHandler;
// Courtesy - https://github.com/websockets/ws/issues/686#issuecomment-254173831
const sendPings = () => {
    // console.log("Sending Pings ...");
    [...ConnectionsDataService_1.activeConnections.keys()].forEach(ws => {
        const metaData = ConnectionsDataService_1.activeConnections.get(ws);
        if ((new Date().getTime()) - metaData.lastPongReceived > config_1.appConfiguration.connectionTimeoutDurationMillis) {
            console.log(`pong timeout for ${metaData.deviceID} has elapsed. Hence closing connection`);
            ws._socket.destroy();
            ConnectionsDataService_1.activeConnections.delete(ws);
        }
        if (ws.readyState === 1) {
            ws.ping('.', false);
        }
    });
};
exports.sendPings = sendPings;
