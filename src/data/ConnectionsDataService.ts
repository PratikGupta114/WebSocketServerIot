
import WebSocket from "ws";
import { MetaData } from "./Types"

export const activeConnections: Map<WebSocket.WebSocket, MetaData> = new Map();

