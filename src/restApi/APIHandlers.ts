


import { client } from "../index"
import { ClientConnectionRecord, TempMetaDataCls } from "../data/Types"
import { appConfiguration } from "../config";
import { getInstanceNameIDAndZone } from "../data/Monitoring";
import { tempMetaData } from "../data/Types";





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