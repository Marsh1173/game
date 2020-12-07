import { ClassType } from "../classtype";
import { getRandomColor } from "../getrandomcolor";
import { Game } from "./game";
import { ServerTalker } from "./servertalker";
import { safeGetElementById } from "./util";

const instructionDiv = safeGetElementById("instructionMenu");
const instructionButton = safeGetElementById("instructions");

let classType: ClassType = "ninja";
const storageClassType = localStorage.getItem('classType') as ClassType | null;
if (storageClassType) {
    changeClass(storageClassType);
}


safeGetElementById('ninja').onclick = () => {
    changeClass("ninja");
};
safeGetElementById('wizard').onclick = () => {
    changeClass("wizard");
};
safeGetElementById('warrior').onclick = () => {
    changeClass("warrior");
};


safeGetElementById("gameDiv").style.display = "none";
instructionDiv.style.display = "none";

const savedFields = [
    'name',
    'team',
    'color',
];
savedFields.forEach(id => {
    const field = safeGetElementById(id) as HTMLInputElement;
    const value = localStorage.getItem(id)
    if (value) {
        field.value = value
    }
});


safeGetElementById("start").onclick = async () => {
    savedFields.forEach(id => {
        const field = safeGetElementById(id) as HTMLInputElement;
        localStorage.setItem(id, field.value);
    });
    //config.playerName = safeGetElementById("name").value; // shows an error but it works?

    let name: string = (safeGetElementById("name") as HTMLInputElement).value;
    if (name === "") name = "Player";
    else if (name.split(" ").join("") === "") name = "Poop";

    const serverTalker = new ServerTalker({
        name,
        color: (safeGetElementById("color") as HTMLInputElement).value,
        classType,
        team: parseInt((safeGetElementById("team") as HTMLInputElement).value),
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

function changeClass(id: ClassType) {
    classType = id;
    localStorage.setItem('classType', id.toString());
    let Array = document.getElementsByClassName('classSelected');
    for (let i = 0; i < Array.length; i++) {
        Array[i].classList.remove('classSelected');
    }
    safeGetElementById(id.toString()).classList.add('classSelected');
}