import * as dotenv from "dotenv"

dotenv.config();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const DEFAULT_PRIVATE_KEY_FILE_PATH = "./certs/key.pem";
const DEFAULT_CERTIFICATE_FILE_PATH = "./certs/cert.pem";
const DEFAULT_DATA_DIRECTORY_PATH = "./Data";

const DEFAULT_PING_INTERVAL_DURATION_MILLIS = 500;
const DEFAULT_CONNECTION_TIMEOUT_DURATION_MILLIS = 2000;
const DEFAULT_WEBSOCKET_CONNECTION_METRIC_UPDATE_INTERVAL_MILLIS = 60000

const DEFAULT_PORT = 3001;
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_HOST = "192.168.1.107";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type BuildType = "development" | "testing" | "release"

export type FilePathsType = {
    privateKey: string;
    certificate: string;
    data: string;
}

export type AppConfiguration = {
    projectId: string;
    buildType: BuildType;
    host: string | undefined;
    port: number;
    redisPort: number;
    filePaths: FilePathsType;
    pingIntervalMillis: number;
    connectionMetricUpdateIntervalMillis: number;
    connectionTimeoutDurationMillis: number;
}

const buildType: BuildType = String(process.env.NODE_ENV || "development") as BuildType;

const port: number = Number(process.env.PORT) || DEFAULT_PORT;
const host: string = String(process.env.HOST || DEFAULT_HOST);
const projectId: string = String(process.env.PROJECT_ID || "");
const redisPort: number = Number(process.env.REDIS_PORT) || DEFAULT_REDIS_PORT;

const pingIntervalMillis: number = Number(process.env.PING_INTERVAL_DURATION_MILLIS)
    || DEFAULT_PING_INTERVAL_DURATION_MILLIS;
const connectionTimeoutDurationMillis: number = Number(process.env.CONNECTION_TIMEOUT_DURATION_MILLIS)
    || DEFAULT_CONNECTION_TIMEOUT_DURATION_MILLIS;

const privateKeyFilePath: string = String(process.env.PRIVATE_KEY_FILE_PATH
    || DEFAULT_PRIVATE_KEY_FILE_PATH);
const certificateFilePath: string = String(process.env.CERTIFICATE_FILE_PATH
    || DEFAULT_CERTIFICATE_FILE_PATH);

const dataDirectoryPath = String(process.env.DATA_DIRECTORY_PATH
    || DEFAULT_DATA_DIRECTORY_PATH);

const websocketConnectionsMetricUpdateInterval = Number(process.env.WEBSOCKET_CONNECTION_METRIC_UPDATE_INTERVAL_MILLIS) || DEFAULT_WEBSOCKET_CONNECTION_METRIC_UPDATE_INTERVAL_MILLIS

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const appConfiguration: AppConfiguration = {
    projectId,
    buildType,
    host,
    port,
    pingIntervalMillis,
    connectionTimeoutDurationMillis,
    connectionMetricUpdateIntervalMillis: websocketConnectionsMetricUpdateInterval,
    redisPort,
    filePaths: {
        privateKey: privateKeyFilePath,
        certificate: certificateFilePath,
        data: dataDirectoryPath,
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////