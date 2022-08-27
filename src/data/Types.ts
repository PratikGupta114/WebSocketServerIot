import { BehaviorSubject } from "rxjs";

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

export const tempMetaData = new BehaviorSubject<MetaData>({
    lastPongReceived: 1234,
    pathName: "abcd",
    deviceID: "defg"
});

export type LogLevel = 'E' | 'W' | 'I' | 'D' | 'V';