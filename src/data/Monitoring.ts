import * as monitoring from "@google-cloud/monitoring"
import { appConfiguration } from "../config";
import axios from "axios";

// Creates a client
const client = new monitoring.MetricServiceClient();

const METADATA_URL_PREFIX = "http://metadata.google.internal/computeMetadata/v1/instance/"

/**
 * TODO(developer): Uncomment and edit the following lines of code.
 */

export async function createWebsocketConnectionsMetricDescriptor() {
    const request: monitoring.protos.google.monitoring.v3.ICreateMetricDescriptorRequest = {
        name: client.projectPath(appConfiguration.projectId),
        metricDescriptor: {
            description: 'Total number of Websockets connections with the vm instance.',
            displayName: 'Web Socket Connections',
            type: 'custom.googleapis.com/vm_instances/network/connections/websockets',
            metricKind: 'GAUGE',
            valueType: "INT64",
            unit: '1',
            labels: [
                {
                    "key": 'ws_port',
                    "valueType": "INT64",
                    "description": 'Port number of the server on which the websocket server is running',
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

    const dataPoint = {
        interval: {
            endTime: {
                seconds: (Date.now() / 1000),
            },
        },
        value: {
            int64Value: connections,
        },
    };

    const monitoredResource = await getMonitoredResourceForCurrentInstance();
    const timeSeriesData = {
        metric: {
            type: 'custom.googleapis.com/vm_instances/network/connections/websockets',
            labels: {
                "ws_port": String(port),
            },
        },
        resource: monitoredResource,
        points: [dataPoint],
    };

    const request: monitoring.protos.google.monitoring.v3.ICreateTimeSeriesRequest = {
        name: client.projectPath(appConfiguration.projectId),
        timeSeries: [timeSeriesData],
    };

    // Writes time series data
    const result = await client.createTimeSeries(request);
    console.log('Done writing time series data.', result);
}

export async function deleteWebSocketConnectionsMetricDescriptor() {

    const metricId = 'custom.googleapis.com/vm_instances/network/connections/websockets';
    const request = {
        name: client.projectMetricDescriptorPath(appConfiguration.projectId, metricId),
    };
    // Deletes a metric descriptor
    const [result] = await client.deleteMetricDescriptor(request);
    console.log(`Deleted ${metricId}`, result);
}

// https://cloud.google.com/compute/docs/metadata/querying-metadata
const getMonitoredResourceForCurrentInstance = async () => {

    // Get the name
    let res = await axios.get(`${METADATA_URL_PREFIX}/name`, { headers: { "Metadata-Flavor": "Google" } })
    const instanceName = String(res.data);

    console.log("Current Instance name : ", instanceName);

    // Get the instanceId
    res = await axios.get(`${METADATA_URL_PREFIX}/id`, { headers: { "Metadata-Flavor": "Google" } })
    const instanceId = String(res.data);

    // Get the zone name
    res = await axios.get(`${METADATA_URL_PREFIX}/zone`, { headers: { "Metadata-Flavor": "Google" } })
    const parts = String(res.data).split("/");
    const zoneName = parts[parts.length - 1];

    return {
        "type": "gce_instance",
        "labels": {
            "project_id": appConfiguration.projectId,
            "instance_id": instanceId,
            "zone": zoneName
        }
    }
};

