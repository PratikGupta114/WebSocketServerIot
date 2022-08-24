"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.get("/", (req, res) => {
    res.status(200).send({
        "message": "Hello World"
    });
});
const io = new socket_io_1.Server(httpServer);
io.on("connection", (socket) => {
    console.log("New connection with client : ", socket);
});
io.on('connect_failed', function () {
    console.log('Connection Failed');
});
io.listen(config_1.appConfiguration.port /*, () => {
    console.log(`App is now listening to ${appConfiguration.port}`);
}*/);
