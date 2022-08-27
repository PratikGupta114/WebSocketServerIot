export type MetaData = {
    deviceID: string;
    pathName: string;
    lastPongReceived: number;
};

export type ClientConnectionRecord = {
    connectedPath: string;
    instanceID?: string;
    instanceName?: string;
}

export type LogLevel = 'E' | 'W' | 'I' | 'D' | 'V';