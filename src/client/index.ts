import { getRandomColor } from "../getrandomcolor";
import { Game } from "./game";
import { ServerTalker } from "./servertalker";
import { safeGetElementById } from "./util";

const instructionDiv = safeGetElementById("instructionMenu");
const instructionButton = safeGetElementById("instructions");

const name = safeGetElementById("name");
const color = safeGetElementById("color");

safeGetElementById("gameDiv").style.display = "none";
instructionDiv.style.display = "none";

safeGetElementById("start").onclick = async () => {
    //config.playerName = safeGetElementById("name").value; // shows an error but it works?
    const serverTalker = new ServerTalker({
        color: (safeGetElementById("color") as HTMLInputElement).value,
    });
    const { id, info, config } = await serverTalker.serverTalkerReady;
    const game = new Game(info, config, id, serverTalker);
    game.start();
    instructionDiv.style.display = "none";
    safeGetElementById("end").onclick = () => {
        game.end();
    };
};
instructionButton.onclick = () => {
    if (instructionDiv.style.display === "none") {
        instructionDiv.style.display = "block";
        instructionButton.classList.add("selected");
    } else {
        instructionDiv.style.display = "none";
        instructionButton.classList.remove("selected");
    }
};
