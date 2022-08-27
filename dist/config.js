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
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfiguration = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const DEFAULT_PRIVATE_KEY_FILE_PATH = "./certs/key.pem";
const DEFAULT_CERTIFICATE_FILE_PATH = "./certs/cert.pem";
const DEFAULT_DATA_DIRECTORY_PATH = "./Data";
const DEFAULT_PING_INTERVAL_DURATION_MILLIS = 500;
const DEFAULT_CONNECTION_TIMEOUT_DURATION_MILLIS = 2000;
const DEFAULT_WEBSOCKET_CONNECTION_METRIC_UPDATE_INTERVAL_MILLIS = 60000;
const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "192.168.1.107";
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_HOST = "192.168.1.107";
const buildType = String(process.env.NODE_ENV || "development");
const port = Number(process.env.PORT) || DEFAULT_PORT;
const host = String(process.env.HOST || DEFAULT_HOST);
const projectId = String(process.env.PROJECT_ID || "");
const redisPort = Number(process.env.REDIS_PORT) || DEFAULT_REDIS_PORT;
const redisHost = String(process.env.REDIS_HOST) || DEFAULT_REDIS_HOST;
const pingIntervalMillis = Number(process.env.PING_INTERVAL_DURATION_MILLIS)
    || DEFAULT_PING_INTERVAL_DURATION_MILLIS;
const connectionTimeoutDurationMillis = Number(process.env.CONNECTION_TIMEOUT_DURATION_MILLIS)
    || DEFAULT_CONNECTION_TIMEOUT_DURATION_MILLIS;
const privateKeyFilePath = String(process.env.PRIVATE_KEY_FILE_PATH
    || DEFAULT_PRIVATE_KEY_FILE_PATH);
const certificateFilePath = String(process.env.CERTIFICATE_FILE_PATH
    || DEFAULT_CERTIFICATE_FILE_PATH);
const dataDirectoryPath = String(process.env.DATA_DIRECTORY_PATH
    || DEFAULT_DATA_DIRECTORY_PATH);
const websocketConnectionsMetricUpdateInterval = Number(process.env.WEBSOCKET_CONNECTION_METRIC_UPDATE_INTERVAL_MILLIS) || DEFAULT_WEBSOCKET_CONNECTION_METRIC_UPDATE_INTERVAL_MILLIS;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.appConfiguration = {
    projectId,
    buildType,
    host,
    port,
    pingIntervalMillis,
    connectionTimeoutDurationMillis,
    connectionMetricUpdateIntervalMillis: websocketConnectionsMetricUpdateInterval,
    redisHost,
    redisPort,
    filePaths: {
        privateKey: privateKeyFilePath,
        certificate: certificateFilePath,
        data: dataDirectoryPath,
    }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
