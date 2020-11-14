import { JoinMessage, ServerMessage } from "../api/message";
import { config } from "../config";
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
    //config.playerColor = safeGetElementById("color").value;
    const serverTalker = new ServerTalker();
    const joinPromise = new Promise<JoinMessage>((resolve, reject) => {
        serverTalker.messageHandler = (msg: ServerMessage) => {
            if (msg.type === "join") {
                resolve(msg);
            } else {
                reject();
            }
        };
    });
    const info = await joinPromise;
    const game = new Game(info.info, info.id, serverTalker);
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