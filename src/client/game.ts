import { time } from "console";
import { AllInfo } from "../api/allinfo";
import { ServerMessage } from "../api/message";
import { Config } from "../config";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { ClientBlast } from "./blast";
import { ClientArrow } from "./arrow";
import { ClientPlatform } from "./platform";
import { ClientPlayer } from "./player";
import { ClientBasicAttack } from "./basicAttack";
import { ServerTalker } from "./servertalker";
import { safeGetElementById } from "./util";

export class Game {
    private static readonly menuDiv = safeGetElementById("menuDiv");
    private static readonly gameDiv = safeGetElementById("gameDiv");
    private static readonly canvas = safeGetElementById("canvas") as HTMLCanvasElement;
    private static readonly ctx = Game.canvas.getContext("2d")!;
    private readonly keyState: Record<string, boolean> = {};
    private screenPos: number = 0;
    private players: ClientPlayer[] = [];
    private blasts: ClientBlast[] = [];
    private arrows: ClientArrow[] = [];
    private platforms: ClientPlatform[] = [];
    private basicAttacks: ClientBasicAttack[] = [];
    private going: boolean = false;

    private mousePos: Vector = { x: 0, y: 0 };
    private isRightClicking: boolean = false;
    private isLeftClicking: boolean = false;
    private isCharging: number = 0;
    private animationFrame: number = 0;
    private globalElapsedTime: number = 0;
    private basicAttackCooldown: number = 0.5;

    private constructGame(info: AllInfo) {
        this.platforms = info.platforms.map((platformInfo) => new ClientPlatform(this.config, platformInfo));
        this.blasts = info.blasts.map((blastInfo) => new ClientBlast(this.config, blastInfo));
        this.arrows = info.arrows.map((arrowInfo) => new ClientArrow(this.config, arrowInfo));
        this.basicAttacks = info.basicAttacks.map((basicAttackInfo) => new ClientBasicAttack(this.config, basicAttackInfo));
        this.players = info.players.map(
            (playerInfo) =>
                new ClientPlayer(
                    this.config,
                    playerInfo,
                    (position: Vector, color: string, id: number) => {
                        this.blast(position, color, id);
                    },
                    (position: Vector, momentum: Vector, id: number) => {
                        this.arrow(position, momentum, id);
                    },
                    (position: Vector, angle: number, id: number, damage: number, range: number, life: number, spread: number) => {
                        this.basicAttack(position, angle, id, damage, range, life, spread);
                    },
                    this.serverTalker,
                    this.id,
                ),
        );
    }

    constructor(info: AllInfo, private readonly config: Config, private readonly id: number, private readonly serverTalker: ServerTalker) {
        Game.canvas.style.width = this.config.xSize + "px";
        Game.canvas.style.height = this.config.ySize + "px";
        Game.canvas.width = this.config.xSize;
        Game.canvas.height = this.config.ySize;

        this.constructGame(info);

        this.serverTalker.messageHandler = (msg: ServerMessage) => {
            if (msg.type === "info") {
                this.constructGame(msg.info);
            }
        };

        const playerWithId = this.findPlayer();

        // use onkeydown and onkeyup instead of addEventListener because it's possible to add multiple event listeners per event
        // This would cause a bug where each time you press a key it creates multiple blasts or jumps
        safeGetElementById("slider").onmousedown = (e: MouseEvent) => {
            if (e.button === 2) {
                this.isRightClicking = true;
            } else if (e.button === 0 && !playerWithId.isDead && this.basicAttackCooldown <= 0) {
                this.animationFrame = 2;
                this.players.forEach((player) => playerWithId.attemptBasicAttack(this.globalElapsedTime));
                this.isLeftClicking = true;

                if (playerWithId.classType === 0) this.basicAttackCooldown = 0.3;
                else if (playerWithId.classType === 1) this.basicAttackCooldown = 0.4;
                else if (playerWithId.classType === 2) this.basicAttackCooldown = 0.2;

            }
        };
        window.onmouseup = (e: MouseEvent) => {
            if (e.button === 2) {
                // leftClicking
                this.isRightClicking = false;
                if (this.isCharging >= 0.4 && playerWithId.classType === 1) {
                    this.calculateArrow();
                }
                this.isCharging = 0;
            } else if (e.button === 0) {
                this.animationFrame = 0;
                this.isLeftClicking = false;
            }
        };
        window.onmousemove = (e: MouseEvent) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        };
        window.onkeydown = (e: KeyboardEvent) => {
            this.keyState[e.code] = true;
        };
        window.onkeyup = (e: KeyboardEvent) => {
            this.keyState[e.code] = false;
        };
    }

    public start() {
        Game.menuDiv.style.display = "none";
        Game.gameDiv.style.display = "block";

        safeGetElementById("slideContainer").style.height = this.config.ySize + "px";
        safeGetElementById("slider").style.width = this.config.xSize + "px";
        safeGetElementById("slider").style.left = this.screenPos + "px";

        this.going = true;
        window.requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    public end() {
        Game.gameDiv.style.display = "none";
        Game.menuDiv.style.display = "block";
        this.going = false;
        this.serverTalker.leave();
    }

    private lastFrame?: number;
    public loop(timestamp: number) {
        if (!this.lastFrame) {
            this.lastFrame = timestamp;
        }
        const elapsedTime = (timestamp - this.lastFrame) / 1000;
        this.lastFrame = timestamp;
        this.update(elapsedTime);
        this.render();
        if (this.going) {
            window.requestAnimationFrame((timestamp) => this.loop(timestamp));
        }
    }

    private update(elapsedTime: number) {

        const playerWithId = this.findPlayer();

        playerWithId.focusPosition.x = this.mousePos.x - this.screenPos;
        playerWithId.focusPosition.y = this.mousePos.y;
        playerWithId.animationFrame += (this.animationFrame - playerWithId.animationFrame) / 2;
        this.globalElapsedTime = elapsedTime;

        if (this.basicAttackCooldown > 0 ) {
            this.basicAttackCooldown -= elapsedTime;
        } else if (this.basicAttackCooldown < 0) {
            this.basicAttackCooldown = 0;
        }



        this.updateSlider();

        
        if (this.keyState[this.config.playerKeys.up]) {
            playerWithId.attemptJump();
            this.keyState[this.config.playerKeys.up] = false;
        }
        if (this.keyState[this.config.playerKeys.left]) {
            playerWithId.attemptMoveLeft(elapsedTime);
        }
        if (this.keyState[this.config.playerKeys.right]) {
            playerWithId.attemptMoveRight(elapsedTime);
        }
        if (this.keyState[this.config.playerKeys.down]) {
            playerWithId.attemptBlast(elapsedTime);
            this.keyState[this.config.playerKeys.down] = false;
        }

        //update if player is charging, can be cleaned up
        if (this.isRightClicking && this.isCharging < 1 && playerWithId.isDead === false) this.isCharging += elapsedTime * 3;
        else if (this.isCharging > 1) this.isCharging = 1;

        //update health bar
        safeGetElementById("health").style.width = playerWithId.health * 1.02 + "%";
        if (playerWithId.isShielded) safeGetElementById("health").style.background = "cyan";
        else safeGetElementById("health").style.background = "rgb(201, 0, 0)";

        this.players.forEach((player) => player.update(elapsedTime));

        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);

        this.arrows.forEach((arrow) => arrow.update(elapsedTime));
        this.arrows = this.arrows.filter((arrow) => arrow.isDead === false);

        this.basicAttacks.forEach((basicAttack) => basicAttack.update(elapsedTime));
        this.basicAttacks = this.basicAttacks.filter((basicAttack) => basicAttack.life > 0);

        // Collision detection with other players or platforms
        this.players.forEach((player1) => {
            /*this.players.forEach((player2) => {
                if (player1 !== player2 && player2.isDead === false && player1.isDead === false) {
                    player1.checkCollisionWithRectangularObject(player2, elapsedTime);
                }
            });*/
            this.platforms.forEach((platform) => {
                player1.checkCollisionWithRectangularObject(platform, elapsedTime);
            });
        });

        this.arrows.forEach((arrow) => {
            if (!arrow.inGround) {
                this.platforms.forEach((platform) => {
                    arrow.checkCollisionWithRectangularObject(platform, elapsedTime / 4);
                    arrow.checkCollisionWithRectangularObject(platform, elapsedTime / 2);
                    arrow.checkCollisionWithRectangularObject(platform, elapsedTime);
                });
                this.players.forEach((player) => {
                    arrow.checkCollisionWithPlayer(player, elapsedTime);
                });
            }
        });

        this.render();
    }

    private findPlayer() {
        const playerWithId = this.players.find((player) => player.id === this.id);
        if (!playerWithId) {
            throw new Error("Player with my id does not exist in data from server");
        }
        return playerWithId;
    }

    private render() {
        Game.ctx.clearRect(0, 0, this.config.xSize, this.config.ySize);
        this.arrows.forEach((arrow) => arrow.render(Game.ctx));
        this.platforms.forEach((platform) => platform.render(Game.ctx));
        this.players.forEach((player) => player.render(Game.ctx));
        this.players.forEach((player) => {
            /*if (player.id === this.id && this.isCharging != 0 && !player.isDead && this.isLeftClicking) {
                player.renderMouseCharge(Game.ctx, this.isCharging);
            }*/
            if (!player.isDead)player.renderWeapon(Game.ctx);
        });
        this.blasts.forEach((blast) => blast.render(Game.ctx));
        //this.basicAttacks.forEach((basicAttack) => basicAttack.render(Game.ctx));
    }

    private updateSlider() {
        const playerWithId = this.findPlayer();

        //check if screen is bigger than field
        if (this.config.xSize < window.innerWidth - 20) {
            this.screenPos = 0;
        } else {
            let temp = this.screenPos + (-playerWithId.position.x + window.innerWidth / 2 - this.screenPos) / 10;
            //make a temp position to check where it would be updated to
            if (this.screenPos < temp + 1 && this.screenPos > temp - 1) {
                return; //so it's not updating even while idle
            }

            if (temp > 0) {
                // if they're too close to the left wall
                if (this.screenPos === 0) return;
                this.screenPos = 0;
            } else if (temp < -(this.config.xSize - window.innerWidth + 6)) {
                // or the right wall
                if (this.screenPos === -(this.config.xSize - window.innerWidth + 6)) return;
                this.screenPos = -(this.config.xSize - window.innerWidth + 6);
            } else {
                if (this.screenPos > temp + 1 || this.screenPos < temp - 1) {
                    this.screenPos = temp; // otherwise the predicted position is fine
                }
            }
        }

        safeGetElementById("slider").style.left = this.screenPos + "px";
    }

    private calculateArrow() {
        const playerWithId = this.findPlayer();

        let newX: number = this.mousePos.x - this.screenPos - playerWithId.position.x - this.config.playerSize / 2;
        let newY: number = this.mousePos.y - playerWithId.position.y - this.config.playerSize / 2;
        //changes the player's mouse positions based on their location

        const angle: number = Math.atan(newX / newY);

        newX = Math.sin(angle) * this.config.arrowPower * this.isCharging;
        newY = Math.cos(angle) * this.config.arrowPower * this.isCharging;

        if (this.mousePos.y - playerWithId.position.y - this.config.playerSize / 2 < 0) {
            newX *= -1;
            newY *= -1;
        }

        playerWithId.focusPosition.x = newX;
        playerWithId.focusPosition.y = newY;

        if (playerWithId.isDead === false) playerWithId.attemptArrow();
    }

    private blast(position: Vector, color: string, id: number) {
        const blast = new ClientBlast(this.config, {
            position,
            color,
            id,
            opacity: 1,
            size: 0,
        });
        this.blasts.push(blast);
        this.players.forEach((player) => {
            blast.blastPlayer(player);
        });
        this.arrows.forEach((arrow) => {
            if (!arrow.inGround) blast.blastArrow(arrow);
        });
    }

    private arrow(position: Vector, momentum: Vector, id: number) {
        const arrow = new ClientArrow(this.config, {
            position,
            momentum,
            id,
            inGround: false,
            isDead: false,
        });
        this.arrows.push(arrow);
    }

    private basicAttack(position: Vector, angle: number, id: number, damage: number, range: number, life: number, spread: number) {
        const basicAttack = new ClientBasicAttack(this.config, {
            position,
            angle,
            id,
            damage,
            range,
            life,
            spread,
        });
        this.basicAttacks.push(basicAttack);
        this.players.forEach((player) => {
            basicAttack.basicAttackPlayer(player);
        });
    }
}
