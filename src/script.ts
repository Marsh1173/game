import { config } from "./config";
import { Game } from "./game";
import { safeGetElementById } from "./util";

safeGetElementById("gameDiv").style.display = "none";
safeGetElementById("start").onclick = () => {
    const game = new Game(config);
    game.start();
};
