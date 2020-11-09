import { config } from "../config";
import { Game } from "./game";
import { safeGetElementById } from "./util";

const instructionDiv = safeGetElementById("instructionMenu");
const instructionButton = safeGetElementById("instructions");

var width = safeGetElementById("width") as HTMLInputElement;
width.step = "50";
var widthOutput = safeGetElementById("widthOutput");
width.oninput = function () {
    config.xSize = parseInt(width.value);
    widthOutput.innerHTML = "Width: " + config.xSize + "px";
};

safeGetElementById("gameDiv").style.display = "none";
instructionDiv.style.display = "none";
safeGetElementById("2player").onclick = () => {
    selectPlayers(2);
};
safeGetElementById("3player").onclick = () => {
    selectPlayers(3);
};
safeGetElementById("4player").onclick = () => {
    selectPlayers(4);
};
safeGetElementById("5player").onclick = () => {
    selectPlayers(5);
};
safeGetElementById("6player").onclick = () => {
    selectPlayers(6);
};
safeGetElementById("start").onclick = () => {
    const game = new Game(config);
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

function selectPlayers(num: number) {
    config.playerCount = num;
    let elems = document.getElementsByClassName("small selected");
    for (let i = 0; i < elems.length; i++) {
        elems[i].classList.remove("selected");
    }
    const id = num + "player";
    safeGetElementById(id).classList.add("selected");
}
