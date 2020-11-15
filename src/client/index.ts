import { getRandomColor } from "../getrandomcolor";
import { Game } from "./game";
import { ServerTalker } from "./servertalker";
import { safeGetElementById } from "./util";

const instructionDiv = safeGetElementById("instructionMenu");
const instructionButton = safeGetElementById("instructions");

const name = safeGetElementById("name");
const color = safeGetElementById("color");
var classType: number = 0;


safeGetElementById('rogue').onclick = () => {
    classType = 0;
    changeClass('rogue');
};
safeGetElementById('wizard').onclick = () => {
    classType = 1;
    changeClass('wizard');
};
safeGetElementById('templar').onclick = () => {
    classType = 2;
    changeClass('templar');
};


safeGetElementById("gameDiv").style.display = "none";
instructionDiv.style.display = "none";

safeGetElementById("start").onclick = async () => {
    //config.playerName = safeGetElementById("name").value; // shows an error but it works?

    let name: string = (safeGetElementById("name") as HTMLInputElement).value;
    if (name === "") name = "Player";

    const serverTalker = new ServerTalker({
        name,
        color: (safeGetElementById("color") as HTMLInputElement).value,
        classType: classType,
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

function changeClass(id: string) {
    let Array = document.getElementsByClassName('classSelected');
    for (let i = 0; i < Array.length; i++) {
        Array[i].classList.remove('classSelected');
    }
    safeGetElementById(id).classList.add('classSelected');
}