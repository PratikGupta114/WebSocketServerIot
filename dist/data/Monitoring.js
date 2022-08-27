"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstanceNameIDAndZone = exports.getMonitoredResourceForCurrentInstance = exports.deleteWebSocketConnectionsMetricDescriptor = exports.updateWebsocketConnectionsMetricDescriptor = exports.createWebsocketConnectionsMetricDescriptor = void 0;
const monitoring = __importStar(require("@google-cloud/monitoring"));
const config_1 = require("../config");
const axios_1 = __importDefault(require("axios"));
// Creates a client
const client = new monitoring.MetricServiceClient();
const METADATA_URL_PREFIX = "http://metadata.google.internal/computeMetadata/v1/instance/";
const METRIC_IDENTIFIER = "custom.googleapis.com/vm_instance/network/total_websockets_connection";
/**
 * TODO(developer): Uncomment and edit the following lines of code.
 */
async function createWebsocketConnectionsMetricDescriptor() {
    const request = {
        name: client.projectPath(config_1.appConfiguration.projectId),
        metricDescriptor: {
            description: 'Total number of Websockets connections with the vm instance.',
            displayName: 'Total WebSocket Connections',
            type: METRIC_IDENTIFIER,
            metricKind: monitoring.protos.google.api.MetricDescriptor.MetricKind.GAUGE,
            valueType: monitoring.protos.google.api.MetricDescriptor.ValueType.INT64,
            unit: '1',
            launchStage: monitoring.protos.google.api.LaunchStage.ALPHA,
            labels: [
                {
                    "key": 'ws_port',
                    "valueType": "STRING",
                    "description": 'Port number of the instance on which the websocket server is running',
                },
            ],
        },
    };
    // Creates a custom metric descriptor
    // const [ descriptor ] = await client.createMetricDescriptor(request);
    const [descriptor] = await client.createMetricDescriptor(request);
    console.log('Created custom Metric:\n');
    console.log(`Name: ${descriptor.displayName}`);
    console.log(`Description: ${descriptor.description}`);
    console.log(`Type: ${descriptor.type}`);
    console.log(`Kind: ${descriptor.metricKind}`);
    console.log(`Value Type: ${descriptor.valueType}`);
    console.log(`Unit: ${descriptor.unit}`);
    console.log('Labels:');
    if (!!descriptor.labels && descriptor.labels.length) {
        descriptor.labels.forEach(label => {
            console.log(`  ${label.key} (${label.valueType}) - ${label.description}`);
        });
    }
}
exports.createWebsocketConnectionsMetricDescriptor = createWebsocketConnectionsMetricDescriptor;
async function updateWebsocketConnectionsMetricDescriptor(connections, port) {
    const monitoredResource = await (0, exports.getMonitoredResourceForCurrentInstance)();
    const request = {
        name: client.projectPath(config_1.appConfiguration.projectId),
        timeSeries: [{
                metric: {
                    type: METRIC_IDENTIFIER,
                    labels: {
                        "ws_port": String(port),
                    },
                },
                metricKind: monitoring.protos.google.api.MetricDescriptor.MetricKind.GAUGE,
                valueType: monitoring.protos.google.api.MetricDescriptor.ValueType.INT64,
                resource: monitoredResource,
                points: [{
                        interval: {
                            endTime: {
                                seconds: (Date.now() / 1000),
                            },
                        },
                        value: {
                            int64Value: connections,
                        },
                    }],
                unit: "1"
            }],
    };
    // Writes time series data
    const result = await client.createTimeSeries(request);
    console.log('Done writing time series data.', result);
}
exports.updateWebsocketConnectionsMetricDescriptor = updateWebsocketConnectionsMetricDescriptor;
async function deleteWebSocketConnectionsMetricDescriptor() {
    const metricId = METRIC_IDENTIFIER;
    const request = {
        name: client.projectMetricDescriptorPath(config_1.appConfiguration.projectId, metricId),
    };
    // Deletes a metric descriptor
    const [result] = await client.deleteMetricDescriptor(request);
    console.log(`Deleted ${metricId}`, result);
}
exports.deleteWebSocketConnectionsMetricDescriptor = deleteWebSocketConnectionsMetricDescriptor;
// https://cloud.google.com/compute/docs/metadata/querying-metadata
const getMonitoredResourceForCurrentInstance = async () => {
    // Get the name
    // let res = await axios.get(`${METADATA_URL_PREFIX}/name`, { headers: { "Metadata-Flavor": "Google" } })
    // const instanceName = String(res.data);
    // Get the instanceId
    // res = await axios.get(`${METADATA_URL_PREFIX}/id`, { headers: { "Metadata-Flavor": "Google" } })
    // const instanceId = String(res.data);
    // Get the zone name
    // res = await axios.get(`${METADATA_URL_PREFIX}/zone`, { headers: { "Metadata-Flavor": "Google" } })
    // const parts = String(res.data).split("/");
    // const zoneName = parts[parts.length - 1];
    // console.log("Instance name : ", instanceName, " | Instance ID : ", instanceId, " | Zone Name : ", zoneName, " | Project ID : ", appConfiguration.projectId);
    return {
        type: "global",
        labels: {
            "project_id": config_1.appConfiguration.projectId,
            // "instance_id": instanceId,
            // "zone": zoneName
        }
    };
};
exports.getMonitoredResourceForCurrentInstance = getMonitoredResourceForCurrentInstance;
const getInstanceNameIDAndZone = async () => {
    // Get the name
    let res = await axios_1.default.get(`${METADATA_URL_PREFIX}/name`, { headers: { "Metadata-Flavor": "Google" } });
    const instanceName = String(res.data);
    // Get the instanceId
    res = await axios_1.default.get(`${METADATA_URL_PREFIX}/id`, { headers: { "Metadata-Flavor": "Google" } });
    const instanceId = String(res.data);
    // Get the zone name
    res = await axios_1.default.get(`${METADATA_URL_PREFIX}/zone`, { headers: { "Metadata-Flavor": "Google" } });
    const parts = String(res.data).split("/");
    const zoneName = parts[parts.length - 1];
    return {
        instanceName,
        instanceId,
        instanceZone: zoneName
    };
};
exports.getInstanceNameIDAndZone = getInstanceNameIDAndZone;
/**
const monitoring = require('@google-cloud/monitoring');
const client = new monitoring.MetricServiceClient();
async function deleteWebSocketConnectionsMetricDescriptor() {

    const metricId = 'custom.googleapis.com/vm_instances/network/websocket_connections';
    const projectId = "teak-optics-359016";
    const request = {
        name: client.projectMetricDescriptorPath(projectId, metricId),
    };
    // Deletes a metric descriptor
    const [result] = await client.deleteMetricDescriptor(request);
    console.log(`Deleted ${metricId}`, result);
}
deleteWebSocketConnectionsMetricDescriptor().then(() => console.log("Deleted")).catch((error) => console.error(error));


 */ 
