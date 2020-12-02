import * as express from "express";
import { Game } from "./game";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as expressWs from "express-ws";
import { defaultConfig } from "../config";
import { JoinRequest, JoinResponse } from "../api/join";
import { ClientMessage, ServerMessage } from "../api/message";
import { Player } from "../objects/player";
import { Vector } from "../vector";

const game = new Game(defaultConfig);
game.start();

const wsInstance = expressWs(express());
const app = wsInstance.app;
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../../client")));
app.get("/bundle.js", (request, response) => {
    response.sendFile(path.join(__dirname, "../../dist/client/bundle.js"));
});

app.post("/join", (request, response) => {
    const joinRequest: JoinRequest = request.body;
    const newId = Player.getNextId();
    game.newPlayer(newId, joinRequest.name, joinRequest.color, joinRequest.classType, { x: defaultConfig.playerStart.x, y: defaultConfig.playerStart.y }, joinRequest.team);
    const joinResponse: JoinResponse = {
        id: newId,
        config: game.config,
        info: game.allInfo(),
    };
    response.json(joinResponse);
});

app.ws("/:id", (ws, request) => {
    const clientId = parseInt(request.params.id);
    Game.clientMap[clientId] = (message: ServerMessage) => {
        if (ws.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            console.log("Tried to send to a closed websocket");
        }
    };

    ws.on("message", (msg) => {
        const data: ClientMessage = JSON.parse(msg.toString());
        game.handleMessage(clientId, data);
    });
    ws.on("close", () => {
        delete Game.clientMap[clientId];
        game.removePlayer(clientId);
    });
});

app.listen(3000);
