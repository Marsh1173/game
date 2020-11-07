import { Blast } from "./blast";
import { Player } from "./player";
import { safeGetElementById } from "./util";

export class Game {
    private static readonly box = safeGetElementById("myContainer");
    private static readonly menuDiv = safeGetElementById("menuDiv");
    private static readonly gameDiv = safeGetElementById("gameDiv");
    private static readonly blastBox = safeGetElementById("blast1");
    private static readonly wall1 = safeGetElementById("wall1");
    private xSize = window.innerWidth - 50; // decides this.box width in pixels -- SET AUTOMATICALLY TO SCREEN SIZE
    private readonly ySize = 500; // decides this.box height in pixels
    private readonly keyState: Record<string, boolean> = {};
    private readonly players: Player[] = [];
    private readonly blasts: Blast[] = [];
    private frameIntervalId?: NodeJS.Timeout; // higher number means slower game

    constructor(private readonly config: any) {
        if (this.config.playerCount > 0) {
            const player1 = new Player(
                this.xSize / 8,
                (this.ySize * 3) / 4 - config.playerSize,
                "KeyW",
                "KeyS",
                "KeyA",
                "KeyD",
                safeGetElementById("myAnimation1"),
                "red",
            );
            this.players.push(player1);
            const blast1 = new Blast(0, 0, safeGetElementById("blast1"), "red", 0);
            this.blasts.push(blast1);
        }
        if (config.playerCount > 1) {
            const player2 = new Player(
                (this.xSize * 7) / 8 - config.playerSize,
                (this.ySize * 3) / 4 - config.playerSize,
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                safeGetElementById("myAnimation2"),
                "blue",
            );
            this.players.push(player2);
            const blast2 = new Blast(0, 0, safeGetElementById("blast2"), "blue", 0);
            this.blasts.push(blast2);
        }
        if (config.playerCount > 2) {
            const player3 = new Player(
                ((this.xSize - config.playerSize) * (config.playerCount - 2)) / (config.playerCount - 1),
                (this.ySize * 3) / 4 - config.playerSize,
                "KeyI",
                "KeyK",
                "KeyJ",
                "KeyL",
                safeGetElementById("myAnimation3"),
                "green",
            );
            this.players.push(player3);
            const blast3 = new Blast(0, 0, safeGetElementById("blast3"), "green", 0);
            this.blasts.push(blast3);
        }
        if (config.playerCount > 3) {
            const player4 = new Player(
                (this.xSize - config.playerSize) / 3,
                (this.ySize * 3) / 4 - config.playerSize,
                "Numpad8",
                "Numpad5",
                "Numpad4",
                "Numpad6",
                safeGetElementById("myAnimation4"),
                "purple",
            );
            this.players.push(player4);
            const blast4 = new Blast(0, 0, safeGetElementById("blast4"), "purple", 0);
            this.blasts.push(blast4);
        }

        Game.box.style.width = this.xSize + "px";
        Game.box.style.height = this.ySize + "px";

        Game.wall1.style.width = (this.xSize * 3) / 4 + "px";
        Game.wall1.style.top = (this.ySize * 3) / 4 + "px";
        Game.wall1.style.left = this.xSize / 8 + "px";

        window.addEventListener(
            "keydown",
            (e) => {
                this.keyState[e.code || e.which] = true;
                this.players.forEach((player, index) => {
                    if (player.isDead === false && e.code === player.keyDown && player.blastCounter <= 0) {
                        this.blast(player.posX, player.posY, index);
                        player.blastCounter = config.blastCooldown;
                    }
                });
            },
            true,
        );
        window.addEventListener(
            "keyup",
            (e) => {
                this.keyState[e.code || e.which] = false;
                this.players.forEach((player) => {
                    if (e.code === player.keyUp) {
                        player.canJump = true;
                    }
                });
            },
            true,
        );
    }

    public start() {
        Game.menuDiv.style.display = "none";
        Game.gameDiv.style.display = "block";
        this.frameIntervalId = setInterval(() => {
            this.frame();
        }, 16);
    }

    public end() {
        Game.gameDiv.style.display = "none";
        Game.menuDiv.style.display = "block";
        if (this.frameIntervalId) {
            clearInterval(this.frameIntervalId);
        }
    }

    private frame() {
        if (this.xSize != window.innerWidth - 50) {
            this.xSize = window.innerWidth - 50;
            Game.box.style.width = this.xSize + "px";
            Game.wall1.style.width = (this.xSize * 3) / 4 + "px";
            Game.wall1.style.left = this.xSize / 8 + "px";
        } // update window size if it has changed

        const playersLeft = this.players.filter((player) => !player.isDead);
        if (playersLeft.length === 1) {
            alert(`${playersLeft[0].color} won!!`);
            this.end();
        }

        this.updateMomentum(); // update momentum based on keys pressed

        this.players.forEach((player) => {
            this.momentumCheck(player);
        });

        this.setAllNotStanding();

        this.players.forEach((player1) => {
            if (player1.isDead === false) {
                this.players.forEach((player2) => {
                    if (player1 !== player2 && player2.isDead === false) {
                        this.playerPathfind(player1, player2);
                    }
                });
            }
        });

        this.players.forEach((player) => {
            this.updatePosition(player);
        });

        this.players.forEach((player) => {
            this.positionCheck(player);
        });

        this.updatePlayers(); // change the this.boxes' positions based on the variables' positions

        this.blasts.forEach((blast, index) => {
            this.updateBlasts(blast, index);
        });
    }

    private updateMomentum() {
        this.players.forEach((player) => {
            if (!player.isDead && this.keyState[player.keyUp] && player.alreadyJumped <= 0 && player.canJump) {
                player.momentumY -= this.config.jumpSize;
                player.alreadyJumped = 2;
                player.canJump = false;
            }
            if (!player.isDead && this.keyState[player.keyLeft] && player.momentumX > -10) {
                player.momentumX -= 3;
            }
            if (!player.isDead && this.keyState[player.keyRight] && player.momentumX < 10) {
                player.momentumX += 3;
            }
        });
    }

    private momentumCheck(player: Player) {
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
        } else if (player.posY === this.ySize - this.config.playerSize && player.momentumY > 0) {
            player.momentumY = 0;
        } else if (player.momentumY > 20) {
            player.momentumY = 20;
        } else {
            player.momentumY += 1;
        }
    }

    private setAllNotStanding() {
        this.players.forEach((player) => {
            if (player.standing === true) {
                player.wasStanding = true;
                player.standing = false;
            } else {
                player.wasStanding = false;
            }
        });
    }

    private playerPathfind(player1: Player, player2: Player) {
        if (player1.momentumX === 0 && player1.posY === this.ySize - this.config.playerSize) {
            //return;
        }

        let distanceX = player2.posX - (player1.posX + player1.momentumX);
        let distanceY = player2.posY - (player1.posY + player1.momentumY);

        if (
            distanceX <= this.config.playerSize &&
            distanceX >= -this.config.playerSize &&
            distanceY <= this.config.playerSize &&
            distanceY >= -this.config.playerSize
        ) {
            if (Math.abs(distanceX) <= Math.abs(distanceY)) {
                if (distanceY < 0 && player1.wasStanding === false) {
                    //hitting someone from beneath
                    player1.posY = player2.posY + this.config.playerSize;
                    if (player1.momentumY <= 0) {
                        player1.momentumY = 0;
                    }
                } else if (distanceY > 0) {
                    //hitting someone from above
                    player1.standing = true;
                    player1.posY = player2.posY - this.config.playerSize;
                    if (player1.momentumY > 0) {
                        player1.momentumY = 0;
                    }
                }
            } else {
                if (distanceX > 0) {
                    //hitting someone from their left?
                    player1.posX = player2.posX - this.config.playerSize;
                    player1.momentumX = 0;
                } else {
                    //hitting someone from their right?
                    player1.posX = player2.posX + this.config.playerSize;
                    player1.momentumX = 0;
                }
            }
        }
    }

    private updatePosition(player: Player) {
        player.posX += player.momentumX;
        player.posY += player.momentumY;
    }

    private positionCheck(player: Player) {
        if (player.posX > this.xSize - this.config.playerSize) {
            // left and right walls
            player.posX = this.xSize - this.config.playerSize;
            if (player.momentumX > 5) player.momentumX = player.momentumX / -2;
            else if (player.momentumX > 0) player.momentumX = 0;
        } else if (player.posX < 0) {
            player.posX = 0;
            if (player.momentumX < -5) player.momentumX = player.momentumX / -2;
            else if (player.momentumX < 0) player.momentumX = 0;
        }
        if (player.posY > this.ySize - this.config.playerSize) {
            // top and bottom walls
            player.posY = this.ySize - this.config.playerSize;
            player.standing = true;
        } else if (player.posY < 0) {
            player.posY = 0;
        }

        if (
            player.posX > this.xSize / 8 - this.config.playerSize &&
            player.posX < (this.xSize * 7) / 8 &&
            player.posY > (this.ySize * 3) / 4 - this.config.playerSize &&
            player.posY < (this.ySize * 3) / 4 - this.config.playerSize / 2
        ) {
            player.standing = true;
            player.posY = (this.ySize * 3) / 4 - this.config.playerSize; // top
            player.momentumY = 0;
        } else if (
            player.posX > this.xSize / 8 - this.config.playerSize &&
            player.posX < (this.xSize * 7) / 8 &&
            player.posY > (this.ySize * 3) / 4 &&
            player.posY < (this.ySize * 3) / 4 + 10
        ) {
            player.posY = (this.ySize * 3) / 4 + 10; // bottom
            player.momentumY = 0;
        } else if (
            player.posX > this.xSize / 8 - this.config.playerSize &&
            player.posX < (this.xSize * 7) / 8 &&
            player.posY > (this.ySize * 3) / 4 &&
            player.posY < (this.ySize * 3) / 4 + 10
        ) {
            //player.posY = (this.ySize * 3 / 4) + 10; // left
            //player.momentumY = 0;
        } else if (
            player.posX > this.xSize / 8 - this.config.playerSize &&
            player.posX < (this.xSize * 7) / 8 &&
            player.posY > (this.ySize * 3) / 4 &&
            player.posY < (this.ySize * 3) / 4 + 10
        ) {
            //player.posY = (this.ySize * 3 / 4) + 10; // right
            //player.momentumY = 0;
        }

        if (player.momentumY === 0 && player.alreadyJumped > 0) {
            // update jump counter
            player.alreadyJumped--;
        }

        if (!player.isDead && player.posY >= this.ySize - this.config.playerSize) {
            player.isDead = true;
            player.elem.style.opacity = "0.2";
        }
    }

    private updatePlayers() {
        this.players.forEach((player) => {
            player.elem.style.left = player.posX + "px";
            player.elem.style.top = player.posY + "px";
        });
    }

    private updateBlasts(blast: Blast, num: number) {
        if (blast.opacity > 0) {
            // reduce blast opacity
            blast.posX -= this.config.playerSize / 6;
            blast.posY -= this.config.playerSize / 6;
            blast.size += this.config.playerSize / 3;
            blast.opacity -= 0.05;
            blast.elem.style.opacity = blast.opacity.toString();
            blast.elem.style.left = blast.posX + "px";
            blast.elem.style.top = blast.posY + "px";
            blast.elem.style.width = blast.size + "px";
            blast.elem.style.height = blast.size + "px";
        }
        if (this.players[num].blastCounter > 0) {
            this.players[num].blastCounter -= 1;
        }
    }

    private blast(x: number, y: number, playerIndex: number) {
        this.blasts[playerIndex].posX = x;
        this.blasts[playerIndex].posY = y;
        this.blasts[playerIndex].size = this.config.playerSize;
        this.blasts[playerIndex].opacity = 0.5;
        this.players.forEach((player) => {
            const distance = Math.sqrt(Math.pow(x - player.posX, 2) + Math.pow(y - player.posY, 2));
            if (distance < this.config.playerSize * 4 && distance != 0) {
                player.momentumX = ((player.posX - x) * Math.pow(this.config.playerSize, 1.9)) / Math.pow(distance, 2);
                player.momentumY = ((player.posY - y) * Math.pow(this.config.playerSize, 1.9)) / Math.pow(distance, 2) - 10;
            }
        });
    }
}
