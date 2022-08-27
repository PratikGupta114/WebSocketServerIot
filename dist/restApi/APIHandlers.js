"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpUpgradeHandler = void 0;
const index_1 = require("../index");
const config_1 = require("../config");
const Monitoring_1 = require("../data/Monitoring");
const Types_1 = require("../data/Types");
const validPaths = [
    "/echo",
    "/post",
    "/record"
];
// courtesy - https://github.com/websockets/ws/issues/517#issuecomment-134994157
const httpUpgradeHandler = async (request, socket) => {
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
    // Check if a device with the same macID is already connected.
    // Below is the Old Approach for checking connected devices
    // for (const metaData of activeConnections.values()) {
    //     if (metaData.deviceID === deviceID) {
    //         console.error("Device with ID :", deviceID, " is already connected");
    //         socket.destroy();
    //         return;
    //     }
    // }
    // New Approach
    // const connectionRecord: ClientConnectionRecord = JSON.parse(client.get(`${deviceID}`));
    let str = await index_1.client.get(deviceID);
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
            connectedPath: pathName
        };
        if (config_1.appConfiguration.buildType !== "development") {
            // fetch the instance name and id from the function
            const { instanceId, instanceName } = await (0, Monitoring_1.getInstanceNameIDAndZone)();
            // Since the object is null, hence create the object
            connectionRecord.instanceID = instanceId;
            connectionRecord.instanceName = instanceName;
        }
        // Now that we have the object ready, push it to the redis cache
        await index_1.client.set(deviceID, JSON.stringify(connectionRecord));
    }
    // connection accepted, pass the information to the next callback.
    Types_1.tempMetaData.next({
        pathName: pathName,
        deviceID: deviceID,
        lastPongReceived: (new Date().getTime()),
    });
};
exports.httpUpgradeHandler = httpUpgradeHandler;
// export const activeConnectionsRequestHandler = (req: express.Request, res: express.Response) => {
//     res.status(200).send({
//         "message": "Use the monitoring server for getting the active connections",
//     });
//     return;
//     const connections = [...activeConnections.keys()];
//     if (connections.length <= 0) {
//         res.status(200).send({
//             "message": "No active connections yet",
//             "count": 0,
//             "connections": undefined
//         });
//         return;
//     }
//     const connectionList = [];
//     for (const connection of connections) {
//         const metaData = activeConnections.get(connection);
//         connectionList.push({
//             ...metaData,
//             url: connection.url
//         });
//     }
//     res.header('access-control-allow-origin', '*')
//     res.status(200).send({
//         "message": "Connections fetch success",
//         "count": connectionList.length,
//         "connections": connectionList
//     });
//     return;
// };
