import * as monitoring from "@google-cloud/monitoring"
import { appConfiguration } from "../config";
import axios from "axios";

// Creates a client
const client = new monitoring.MetricServiceClient();

const METADATA_URL_PREFIX = "http://metadata.google.internal/computeMetadata/v1/instance/"

const METRIC_IDENTIFIER = "custom.googleapis.com/vm_instance/network/total_websockets_connection"

/**
 * TODO(developer): Uncomment and edit the following lines of code.
 */

export async function createWebsocketConnectionsMetricDescriptor() {
    const request: monitoring.protos.google.monitoring.v3.ICreateMetricDescriptorRequest = {
        name: client.projectPath(appConfiguration.projectId),
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

export async function updateWebsocketConnectionsMetricDescriptor(connections: number, port: number | string) {


    const monitoredResource = await getMonitoredResourceForCurrentInstance();

    const request: monitoring.protos.google.monitoring.v3.ICreateTimeSeriesRequest = {
        name: client.projectPath(appConfiguration.projectId),
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

export async function deleteWebSocketConnectionsMetricDescriptor() {

    const metricId = METRIC_IDENTIFIER;
    const request = {
        name: client.projectMetricDescriptorPath(appConfiguration.projectId, metricId),
    };
    // Deletes a metric descriptor
    const [result] = await client.deleteMetricDescriptor(request);
    console.log(`Deleted ${metricId}`, result);
}

// https://cloud.google.com/compute/docs/metadata/querying-metadata
export const getMonitoredResourceForCurrentInstance: () => Promise<monitoring.protos.google.api.IMonitoredResource>
    = async () => {

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
                "project_id": appConfiguration.projectId,
                // "instance_id": instanceId,
                // "zone": zoneName
            }
        }
    };

export const getInstanceNameIDAndZone: () => Promise<{ instanceName: string; instanceId: string; instanceZone: string }>
    = async () => {

        // Get the name
        let res = await axios.get(`${METADATA_URL_PREFIX}/name`, { headers: { "Metadata-Flavor": "Google" } })
        const instanceName = String(res.data);

        // Get the instanceId
        res = await axios.get(`${METADATA_URL_PREFIX}/id`, { headers: { "Metadata-Flavor": "Google" } })
        const instanceId = String(res.data);

        // Get the zone name
        res = await axios.get(`${METADATA_URL_PREFIX}/zone`, { headers: { "Metadata-Flavor": "Google" } })
        const parts = String(res.data).split("/");
        const zoneName = parts[parts.length - 1];

        return {
            instanceName,
            instanceId,
            instanceZone: zoneName
        }

    }

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