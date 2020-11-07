import { config } from "./config";
import { Game } from "./game";
import { safeGetElementById } from "./util";

safeGetElementById("gameDiv").style.display = "none";
safeGetElementById("2player").onclick = () => {
    config.playerCount = 2;
};
safeGetElementById("3player").onclick = () => {
    config.playerCount = 3;
};
safeGetElementById("4player").onclick = () => {
    config.playerCount = 4;
};
safeGetElementById("5player").onclick = () => {
    config.playerCount = 5;
};
safeGetElementById("6player").onclick = () => {
    config.playerCount = 6;
};
safeGetElementById("start").onclick = () => {
    const game = new Game(config);
    game.start();
};
