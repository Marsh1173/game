import * as express from "express";
import { Game } from "./game";
import * as path from "path";

const game = new Game();
game.start();

const app = express();

app.use(express.static(path.join(__dirname, "../../client")));
app.get("/bundle.js", (request, response) => {
    response.sendFile(path.join(__dirname, "../../dist/client/bundle.js"));
});

app.get("/info", (request, response) => {
    response.status(200).json(game.allInfo());
});

app.listen(3000);
