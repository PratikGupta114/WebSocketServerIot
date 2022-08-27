

import { IncomingMessage } from "http";
import internal from "stream";
import { client } from "../index"
import { ClientConnectionRecord } from "../data/Types"
import { appConfiguration } from "../config";
import { getInstanceNameIDAndZone } from "../data/Monitoring";
import { tempMetaData } from "../data/Types";

const validPaths = [
    "/echo",
    "/post",
    "/record"
];

// courtesy - https://github.com/websockets/ws/issues/517#issuecomment-134994157
export const httpUpgradeHandler = async (request: IncomingMessage, socket: internal.Duplex) => {

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
            connectedPath: pathName
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

    // connection accepted, pass the information to the next callback.
    tempMetaData.next({
        pathName: pathName as string,
        deviceID: deviceID as string,
        lastPongReceived: (new Date().getTime()),
    });

}

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