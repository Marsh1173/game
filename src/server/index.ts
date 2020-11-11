import * as express from "express";
import { Game } from "./game";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as expressWs from "express-ws";
import { JoinMessage } from "../api/message";

const game = new Game();
game.start();

const wsInstance = expressWs(express());
const app = wsInstance.app;
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../../client")));
app.get("/bundle.js", (request, response) => {
    response.sendFile(path.join(__dirname, "../../dist/client/bundle.js"));
});

app.ws("/", (ws, request) => {
    const clientId = game.newPlayer();
    game.clientMap[clientId] = ws;
    const responseJson: JoinMessage = {
        type: "join",
        id: clientId,
        info: game.allInfo(),
    };
    ws.send(JSON.stringify(responseJson));

    ws.on("message", (msg) => {
        const data = JSON.parse(msg.toString());
        game.handleMessage(clientId, data);
    });
    ws.on("close", () => {
        delete game.clientMap[clientId];
        game.removePlayer(clientId);
    });
});

app.listen(3000);
