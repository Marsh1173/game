import * as express from "express";
import { Game } from "./game";

const game = new Game();
game.start();

const app = express();

app.get("/", (request, response) => {
    response.status(200).send(game.allInfo());
});

app.listen(3000);
