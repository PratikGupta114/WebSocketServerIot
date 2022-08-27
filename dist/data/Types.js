"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tempMetaData = void 0;
const rxjs_1 = require("rxjs");
exports.tempMetaData = new rxjs_1.BehaviorSubject({
    lastPongReceived: 1234,
    pathName: "abcd",
    deviceID: "defg"
});
