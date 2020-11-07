import { config } from "./config";
import { Player } from "./player";
import { Blast } from "./blast";
import { safeGetElementById } from "./util";

const box = safeGetElementById("myContainer");
const blastBox = safeGetElementById("blast1");
let xSize = window.innerWidth - 50; // decides box width in pixels -- SET AUTOMATICALLY TO SCREEN SIZE
const ySize = 500; // decides box height in pixels
const keyState: Record<string, boolean> = {};
let players: Player[] = [];
let blasts: Blast[] = [];

const id = setInterval(frame, 16); // higher number means slower game

if (config.playerCount > 0) {
    const player1 = new Player(xSize / 8, (ySize * 3) / 4 - config.playerSize, "KeyW", "KeyS", "KeyA", "KeyD", safeGetElementById("myAnimation1"), "red");
    players.push(player1);
    const blast1 = new Blast(0, 0, safeGetElementById("blast1"), "red", 0);
    blasts.push(blast1);
}
if (config.playerCount > 1) {
    const player2 = new Player(
        (xSize * 7) / 8 - config.playerSize,
        (ySize * 3) / 4 - config.playerSize,
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        safeGetElementById("myAnimation2"),
        "blue",
    );
    players.push(player2);
    const blast2 = new Blast(0, 0, safeGetElementById("blast2"), "blue", 0);
    blasts.push(blast2);
}
if (config.playerCount > 2) {
    const player3 = new Player(
        ((xSize - config.playerSize) * (config.playerCount - 2)) / (config.playerCount - 1),
        (ySize * 3) / 4 - config.playerSize,
        "KeyI",
        "KeyK",
        "KeyJ",
        "KeyL",
        safeGetElementById("myAnimation3"),
        "green",
    );
    players.push(player3);
    const blast3 = new Blast(0, 0, safeGetElementById("blast3"), "green", 0);
    blasts.push(blast3);
}
if (config.playerCount > 3) {
    const player4 = new Player(
        (xSize - config.playerSize) / 3,
        (ySize * 3) / 4 - config.playerSize,
        "Numpad8",
        "Numpad5",
        "Numpad4",
        "Numpad6",
        safeGetElementById("myAnimation4"),
        "purple",
    );
    players.push(player4);
    const blast4 = new Blast(0, 0, safeGetElementById("blast4"), "purple", 0);
    blasts.push(blast4);
}

box.style.width = xSize + "px";
box.style.height = ySize + "px";
const wall1 = safeGetElementById("wall1");
wall1.style.width = (xSize * 3) / 4 + "px";
wall1.style.top = (ySize * 3) / 4 + "px";
wall1.style.left = xSize / 8 + "px";

window.addEventListener(
    "keydown",
    function (e) {
        keyState[e.code || e.which] = true;
        players.forEach((player, index) => {
            if (player.isDead === false && e.code === player.keyDown && player.blastCounter <= 0) {
                blast(player.posX, player.posY, index);
                player.blastCounter = config.blastCooldown;
            }
        });
    },
    true,
);
window.addEventListener(
    "keyup",
    function (e) {
        keyState[e.code || e.which] = false;
        players.forEach((player) => {
            if (e.code === player.keyUp) {
                player.canJump = true;
            }
        });
    },
    true,
);

function frame() {
    if (xSize != window.innerWidth - 50) {
        xSize = window.innerWidth - 50;
        box.style.width = xSize + "px";
        wall1.style.width = (xSize * 3) / 4 + "px";
        wall1.style.left = xSize / 8 + "px";
    } // update window size if it has changed

    const playersLeft = players.filter((player) => !player.isDead);
    if (playersLeft.length === 1) {
        alert(`${playersLeft[0].color} won!!`);
        clearInterval(id);
        window.location.reload();
    }

    updateMomentum(); // update momentum based on keys pressed

    players.forEach((player) => {
        momentumCheck(player);
    });

    setAllNotStanding();

    players.forEach((player1) => {
      if(player1.isDead === false) {
        players.forEach((player2) => {
            if (player1 !== player2 && player2.isDead === false) {
                playerPathfind(player1, player2);
            }
        });
      }
    });

    players.forEach((player) => {
        updatePosition(player);
    });

    players.forEach((player) => {
        positionCheck(player);
    });

    updatePlayers(); // change the boxes' positions based on the variables' positions

    blasts.forEach((blast, index) => {
      updateBlasts(blast, index);
    });
}

function updateMomentum() {
    players.forEach((player) => {
        if (!player.isDead && keyState[player.keyUp] && player.alreadyJumped <= 0 && player.canJump) {
            player.momentumY -= config.jumpSize;
            player.alreadyJumped = 2;
            player.canJump = false;
        }
        if (!player.isDead && keyState[player.keyLeft] && player.momentumX > -10) {
            player.momentumX -= 3;
        }
        if (!player.isDead && keyState[player.keyRight] && player.momentumX < 10) {
            player.momentumX += 3;
        }
    });
}

function momentumCheck(player: Player) {
    if (player.momentumX < 1 && player.momentumX > -1) {
        player.momentumX = 0;
    } else if (player.momentumX >= 1) {
        if (player.standing === true) {
            player.momentumX -= 1.5;
        } else {
            player.momentumX -= 0.1;
        }
    } else if (player.momentumX <= -1) {
        if (player.standing === true) {
            player.momentumX += 1.5;
        } else {
            player.momentumX += 0.1;
        }
    }

    if (player.posY <= 0) {
        player.momentumY = 1;
    } else if (player.posY === ySize - config.playerSize && player.momentumY > 0) {
        player.momentumY = 0;
    } else if (player.momentumY > 20) {
        player.momentumY = 20;
    } else {
        player.momentumY += 1;
    }
}

function setAllNotStanding() {
    players.forEach((player) => {
        if (player.standing === true) {
            player.wasStanding = true;
            player.standing = false;
        } else {
            player.wasStanding = false;
        }
    });
}

function playerPathfind(player1: Player, player2: Player) {
    if (player1.momentumX === 0 && player1.posY === ySize - config.playerSize) {
        //return;
    }

    let distanceX = player2.posX - (player1.posX + player1.momentumX);
    let distanceY = player2.posY - (player1.posY + player1.momentumY);

    if (distanceX <= config.playerSize && distanceX >= -config.playerSize && distanceY <= config.playerSize && distanceY >= -config.playerSize) {
        if (Math.abs(distanceX) <= Math.abs(distanceY)) {
            if (distanceY < 0 && player1.wasStanding === false) {
                //hitting someone from beneath
                player1.posY = player2.posY + config.playerSize;
                if (player1.momentumY <= 0) {
                    player1.momentumY = 0;
                }
            } else if (distanceY > 0) {
                //hitting someone from above
                player1.standing = true;
                player1.posY = player2.posY - config.playerSize;
                if (player1.momentumY > 0) {
                    player1.momentumY = 0;
                }
            }
        } else {
            if (distanceX > 0) {
                //hitting someone from their left?
                player1.posX = player2.posX - config.playerSize;
                player1.momentumX = 0;
            } else {
                //hitting someone from their right?
                player1.posX = player2.posX + config.playerSize;
                player1.momentumX = 0;
            }
        }
    }
}

function updatePosition(player: Player) {
    player.posX += player.momentumX;
    player.posY += player.momentumY;
}

function positionCheck(player: Player) {
    if (player.posX > xSize - config.playerSize) {
        // left and right walls
        player.posX = xSize - config.playerSize;
        if (player.momentumX > 5) player.momentumX = player.momentumX / -2;
        else if (player.momentumX > 0) player.momentumX = 0;
    } else if (player.posX < 0) {
        player.posX = 0;
        if (player.momentumX < -5) player.momentumX = player.momentumX / -2;
        else if (player.momentumX < 0) player.momentumX = 0;
    }
    if (player.posY > ySize - config.playerSize) {
        // top and bottom walls
        player.posY = ySize - config.playerSize;
        player.standing = true;
    } else if (player.posY < 0) {
        player.posY = 0;
    }

    if (
        player.posX > xSize / 8 - config.playerSize &&
        player.posX < (xSize * 7) / 8 &&
        player.posY > (ySize * 3) / 4 - config.playerSize &&
        player.posY < (ySize * 3) / 4 - config.playerSize / 2
    ) {
        player.standing = true;
        player.posY = (ySize * 3) / 4 - config.playerSize; // top
        player.momentumY = 0;
    } else if (
        player.posX > xSize / 8 - config.playerSize &&
        player.posX < (xSize * 7) / 8 &&
        player.posY > (ySize * 3) / 4 &&
        player.posY < (ySize * 3) / 4 + 10
    ) {
        player.posY = (ySize * 3) / 4 + 10; // bottom
        player.momentumY = 0;
    } else if (
        player.posX > xSize / 8 - config.playerSize &&
        player.posX < (xSize * 7) / 8 &&
        player.posY > (ySize * 3) / 4 &&
        player.posY < (ySize * 3) / 4 + 10
    ) {
        //player.posY = (ySize * 3 / 4) + 10; // left
        //player.momentumY = 0;
    } else if (
        player.posX > xSize / 8 - config.playerSize &&
        player.posX < (xSize * 7) / 8 &&
        player.posY > (ySize * 3) / 4 &&
        player.posY < (ySize * 3) / 4 + 10
    ) {
        //player.posY = (ySize * 3 / 4) + 10; // right
        //player.momentumY = 0;
    }

    if (player.momentumY === 0 && player.alreadyJumped > 0) {
        // update jump counter
        player.alreadyJumped--;
    }

    if (!player.isDead && player.posY >= ySize - config.playerSize) {
        player.isDead = true;
        player.elem.style.opacity = .2;
    }
}

function updatePlayers() {
    players.forEach((player) => {
        player.elem.style.left = player.posX + "px";
        player.elem.style.top = player.posY + "px";
    });
}

function updateBlasts(blast: Blast, num: number) {
      if (blast.opacity > 0) { // reduce blast opacity
        blast.posX -= config.playerSize / 6;
        blast.posY -= config.playerSize / 6;
        blast.size += config.playerSize / 3;
        blast.opacity -= 0.05;
        blast.elem.style.opacity = blast.opacity;
        blast.elem.style.left = blast.posX + 'px';
        blast.elem.style.top = blast.posY + 'px';
        blast.elem.style.width = blast.size + 'px';
        blast.elem.style.height = blast.size + 'px';
      }
      if (players[num].blastCounter > 0) {
        players[num].blastCounter -= 1;
      }
    }

function blast(x: number, y: number, playerIndex: number) {
    blasts[playerIndex].posX = x;
    blasts[playerIndex].posY = y;
    blasts[playerIndex].size = config.playerSize;
    blasts[playerIndex].opacity = 0.5;
    players.forEach((player) => {
        const distance = Math.sqrt(Math.pow(x - player.posX, 2) + Math.pow(y - player.posY, 2));
        if (distance < config.playerSize * 4 && distance != 0) {
            player.momentumX = ((player.posX - x) * Math.pow(config.playerSize, 1.9)) / Math.pow(distance, 2);
            player.momentumY = ((player.posY - y) * Math.pow(config.playerSize, 1.9)) / Math.pow(distance, 2) - 10;
        }
    });
}
