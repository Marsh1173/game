import { Blast } from "./blast";
import { Platform } from "./platform";
import { Player } from "./player";
import { slider, safeGetElementById } from "./util";
import { box, safeGetElementById } from "./util";

export class Game {
    private static readonly menuDiv = safeGetElementById("menuDiv");
    private static readonly gameDiv = safeGetElementById("gameDiv");
    private xSize = this.config.xSize; // decides this.box width in pixels -- SET AUTOMATICALLY TO SCREEN SIZE
    private readonly ySize = 600; // decides this.box height in pixels
    private readonly keyState: Record<string, boolean> = {};
    private readonly players: Player[] = [];
    private blasts: Blast[] = [];
    private platforms: Platform[] = [];
    private frameIntervalId?: NodeJS.Timeout; // higher number means slower game
    private avgPlayerPos = 0;

    constructor(private readonly config: any) {
        if (config.playerCount > 0) {
            const player1 = new Player(
                this.xSize / 8,
                (this.ySize * 3) / 4 - config.playerSize,
                "KeyW",
                "KeyS",
                "KeyA",
                "KeyD",
                safeGetElementById("myAnimation1"),
                "FireBrick",
            );
            this.players.push(player1);
        }
        if (config.playerCount > 1) {
            const player2 = new Player(
                (this.xSize / 8) + ((this.xSize * 3 / 4 - config.playerSize) * 1 / (config.playerCount - 1)),
                (this.ySize * 3) / 4 - config.playerSize,
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                safeGetElementById("myAnimation2"),
                "Navy",
            );
            this.players.push(player2);
        }
        if (config.playerCount > 2) {
            const player3 = new Player(
                (this.xSize / 8) + ((this.xSize * 3 / 4 - config.playerSize) * 2 / (config.playerCount - 1)),
                (this.ySize * 3) / 4 - config.playerSize,
                "KeyP",
                "Semicolon",
                "KeyL",
                "Quote",
                safeGetElementById("myAnimation3"),
                "OliveDrab",
            );
            this.players.push(player3);
        }
        if (config.playerCount > 3) {
            const player4 = new Player(
                (this.xSize / 8) + ((this.xSize * 3 / 4 - config.playerSize) * 3 / (config.playerCount - 1)),
                (this.ySize * 3) / 4 - config.playerSize,
                "Numpad8",
                "Numpad5",
                "Numpad4",
                "Numpad6",
                safeGetElementById("myAnimation4"),
                "orchid   ",
            );
            this.players.push(player4);
        }
        if (config.playerCount > 4) {
            const player4 = new Player(
                (this.xSize / 8) + ((this.xSize * 3 / 4 - config.playerSize) * 4 / (config.playerCount - 1)),
                (this.ySize * 3) / 4 - config.playerSize,
                "Home",
                "End",
                "Delete",
                "PageDown",
                safeGetElementById("myAnimation5"),
                "Turquoise",
            );
            this.players.push(player4);
        }
        if (config.playerCount > 5) {
            const player4 = new Player(
                (this.xSize / 8) + ((this.xSize * 3 / 4 - config.playerSize) * 5 / (config.playerCount - 1)),
                (this.ySize * 3) / 4 - config.playerSize,
                "KeyY",
                "KeyH",
                "KeyG",
                "KeyJ",
                safeGetElementById("myAnimation6"),
                "Orange",
            );
            this.players.push(player4);
        }

        box.style.width = this.xSize + "px";
        box.style.height = this.ySize + "px";
        slider.style.height = this.ySize + "px";

        this.platforms.push(
            new Platform(
                {
                    height: 20,
                    width: (this.xSize * 3) / 4,
                },
                {
                    x: this.xSize / 8,
                    y: (this.ySize * 3) / 4,
                },
            ),
            new Platform(
                {
                    height: 20,
                    width: (this.xSize * 3) / 8,
                },
                {
                    x: this.xSize / 8 + (this.xSize * 3) / 4 / 4,
                    y: (this.ySize) / 2,
                },
            ),
            new Platform(
                {
                    height: 20,
                    width: (this.xSize) / 4,
                },
                {
                    x: this.xSize * 3 / 4,
                    y: (this.ySize) / 4,
                },
            ),
            new Platform(
                {
                    height: 20,
                    width: (this.xSize) / 4,
                },
                {
                    x: 0,
                    y: (this.ySize) / 4,
                },
            ),
        );

        // use onkeydown and onkeyup instead of addEventListener because it's possible to add multiple event listeners per event
        // This would cause a bug where each time you press a key it creates multiple blasts or jumps
        window.onkeydown = (e: KeyboardEvent) => {
            this.keyState[e.code || e.which] = true;
            //console.log(e.code);
            this.players.forEach((player) => {
                if (player.isDead === false && e.code === player.keyDown && player.blastCounter <= 0) {
                    this.blast(player);
                    player.blastCounter = config.blastCooldown;
                }
            });
        };
        window.onkeyup = (e: KeyboardEvent) => {
            this.keyState[e.code || e.which] = false;
            this.players.forEach((player) => {
                if (e.code === player.keyUp) {
                    player.canJump = true;
                }
            });
        };
    }

    public start() {
        slider.style.width = this.xSize + "px";
        slider.style.height = this.ySize + "px";
        Game.menuDiv.style.display = "none";
        Game.gameDiv.style.display = "block";
        this.frameIntervalId = setInterval(() => {
            this.frame();
        }, 16);
    }

    public end() {
        Game.gameDiv.style.display = "none";
        Game.menuDiv.style.display = "block";
        this.blasts.forEach((blast) => blast.delete());
        this.platforms.forEach((platform) => platform.delete());
        const Blasts = document.getElementsByClassName('blast');
        for (let i = 0; i < Blasts.length; i++) {
          Blasts[i].parentNode.removeChild(Blasts[i]);
        }
        for (let i = 0; i < this.players.length; i++) {
          this.players[i].elem.style.top = 0;
          this.players[i].elem.style.left = 0;
          this.players[i].elem.style.background = "white";
        }
        if (this.frameIntervalId) {
            clearInterval(this.frameIntervalId);
        }
    }

    private frame() {

        this.updateSlider();

        /*const playersLeft = this.players.filter((player) => !player.isDead);
        if (playersLeft.length === 1) {
            alert(`${playersLeft[0].color} won!!!!`);
            this.end();
        } else if (playersLeft.length < 1) {
            alert(`Everyone Died!`);
            this.end();
        }*/

        this.updateMomentum(); // update momentum based on keys pressed

        this.players.forEach((player) => {
            this.momentumCheck(player);
        });

        this.setAllNotStanding();

        this.players.forEach((player1) => {
            if (player1.isDead === false) {
                this.players.forEach((player2) => {
                    if (player1 !== player2 && player2.isDead === false) {
                        player1.playerPathfind(player2);
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

        this.players.forEach((player) => {
          if (player.isDead) {
            player.deathCooldown--;
            if (player.deathCooldown <= 0) {
              player.isDead = false;
              player.posX = this.xSize / 2 - this.config.playerSize / 2;
              player.posY = 200;
              player.deathCooldown = 150;
              player.elem.style.opacity = "1";
            }
          }
        });

        this.updatePlayers(); // change the this.boxes' positions based on the variables' positions

        this.blasts.forEach((blast) => blast.update());
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);
    }

    private updateSlider() {
        let avgPlayerPos = this.players.filter((player) => !player.isDead).reduce((result, elem) => result -= elem.posX, 0) / this.players.length;
        if (window.innerWidth - 35 > this.xSize) {
          avgPlayerPos = 0;
        }
        // go off the slider screen if the window is bigger
        else {// else go off the window
          avgPlayerPos += window.innerWidth / 2 - 35;
          if (avgPlayerPos > 0) avgPlayerPos = 0;
          else if (avgPlayerPos * -1 > this.xSize - window.innerWidth + 20) {
            avgPlayerPos = (this.xSize - window.innerWidth + 20) * -1;
          }
        }

        slider.style.left = avgPlayerPos + 'px';

    }

    private updateMomentum() {
        this.players.forEach((player) => {
            if (!player.isDead && this.keyState[player.keyUp] && player.alreadyJumped <= 0 && player.canJump) {
                player.momentumY -= this.config.jumpSize;
                player.alreadyJumped = 2;
                player.canJump = false;
            }
            if (!player.isDead && this.keyState[player.keyLeft] && player.momentumX > -10 && player.standing) {
                player.momentumX -= 3;
            } else if (!player.isDead && this.keyState[player.keyLeft] && player.momentumX > -10) {
                player.momentumX -= 1;
            }
            if (!player.isDead && this.keyState[player.keyRight] && player.momentumX < 10 && player.standing) {
                player.momentumX += 3;
            } else if (!player.isDead && this.keyState[player.keyRight] && player.momentumX < 10) {
                player.momentumX += 1;
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

        this.platforms.forEach((platform) => {
            player.checkCollisionWithPlatform(platform);
        });

        if (player.momentumY === 0 && player.alreadyJumped > 0) {
            // update jump counter
            player.alreadyJumped--;
        }

        if (!player.isDead && player.posY >= this.ySize - this.config.playerSize) {
            player.playerDie();
        }
    }

    private updatePlayers() {
        this.players.forEach((player) => {
            player.elem.style.left = player.posX + "px";
            player.elem.style.top = player.posY + "px";
            //player.elem.innerHTML = player.health; -- PLACEHOLDER
            if (player.blastCounter > 0) {
                player.blastCounter -= 1;
            }
            if (player.health <= 0) {
              //player.playerDie();
            }
        });
    }

    private blast(player: Player) {
        const blast = new Blast(player.posX, player.posY, player.color);
        this.blasts.push(blast);
        this.players.forEach((player2) => {
            const distance = Math.sqrt(Math.pow(player.posX - player2.posX, 2) + Math.pow(player.posY - player2.posY, 2));
            if (distance < this.config.playerSize * 4 && distance != 0) {
                player2.momentumX = ((player2.posX - player.posX) * Math.pow(this.config.playerSize, 1.9)) / Math.pow(distance, 2);
                player2.momentumY = ((player2.posY - player.posY) * Math.pow(this.config.playerSize, 1.9)) / Math.pow(distance, 2) - (this.config.playerSize * 4 - distance) / 13;
                //player2.health -= 5;
            }
        });
    }
}
