import { time } from "console";
import { AllInfo } from "../api/allinfo";
import { ServerMessage } from "../api/message";
import { Config } from "../config";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { ClientBlast } from "./blast";
import { ClientProjectile } from "./projectile";
import { ClientPlatform } from "./platform";
import { ClientPlayer } from "./player";
import { ServerTalker } from "./servertalker";
import { safeGetElementById } from "./util";

export class Game {
    private static readonly menuDiv = safeGetElementById("menuDiv");
    private static readonly gameDiv = safeGetElementById("gameDiv");
    private static readonly canvas = safeGetElementById("canvas") as HTMLCanvasElement;
    private static readonly ctx = Game.canvas.getContext("2d")!;
    private readonly keyState: Record<string, boolean> = {};
    private players: ClientPlayer[] = [];
    private blasts: ClientBlast[] = [];
    private projectiles: ClientProjectile[] = [];
    private platforms: ClientPlatform[] = [];
    private going: boolean = false;

    private screenPos: number = 0;

    private mousePos: Vector = { x: 0, y: 0 };
    private animationFrame: number = 0;

    private isLeftClicking: boolean = false;
    private isLeftCharging: number = 0;
    private leftClickCooldown: number = 0;
    private leftClickCounter: number = 0;

    private isRightClicking: boolean = false;
    private isRightCharging: number = 0;
    private rightClickCooldown: number = 0;
    private rightClickCounter: number = 0;

    private constructGame(info: AllInfo) {
        this.platforms = info.platforms.map((platformInfo) => new ClientPlatform(this.config, platformInfo));
        this.blasts = info.blasts.map((blastInfo) => new ClientBlast(this.config, blastInfo));
        this.projectiles = info.projectiles.map((projectileInfo) => new ClientProjectile(this.config, projectileInfo));
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
        this.setCooldowns(this.findPlayer());

        this.serverTalker.messageHandler = (msg: ServerMessage) => {
            if (msg.type === "info") {
                this.constructGame(msg.info);
            }
        };

        // use onkeydown and onkeyup instead of addEventListener because it's possible to add multiple event listeners per event
        // This would cause a bug where each time you press a key it creates multiple blasts or jumps
        safeGetElementById("slider").onmousedown = (e: MouseEvent) => {

            const playerWithId = this.findPlayer();

            if (e.button === 0 && !playerWithId.isDead && this.leftClickCounter <= 0) {
                //left mouse button click

                this.animationFrame = 2; //will be removed
                this.isLeftClicking = true;
                this.leftClickCounter = this.leftClickCooldown;

                this.isRightClicking = false;
                this.isRightCharging = 0;

                //register basic attack
                this.players.forEach((player) => {
                    if (player.id != this.id) playerWithId.attemptBasicAttack(player)
                });

            } else if (e.button === 2 && !playerWithId.isDead && this.isRightClicking === false) {
                //right mouse button click

                this.isRightClicking = true;
                this.isLeftClicking = false;
                this.isLeftCharging = 0;
                this.animationFrame = 0;
            }
        };
        window.onmouseup = (e: MouseEvent) => {

            const playerWithId = this.findPlayer();

            if (e.button === 0 && this.isLeftClicking === true) { // left mouse release
                
                this.isLeftClicking = false;
                //add left mouse charged ability register that passes isLeftCharging
                this.isLeftCharging = 0;

                this.animationFrame = 0; // will be removed

            } else if (e.button === 2 &&
                this.isRightClicking === true) { // right mouse release

                this.isRightClicking = false;
                //add right mouse charged ability register that passes isRightCharging
                if (this.rightClickCounter <= 0 && this.isRightCharging >= 1 && playerWithId.classType != 2) {
                    playerWithId.attemptSecondaryAttack(this.players);
                    this.rightClickCounter = this.rightClickCooldown;
                }

                this.isRightCharging = 0;

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


        this.updateCooldowns(elapsedTime, playerWithId);
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
        
        /*if (this.keyState[this.config.playerKeys.down]) {
            playerWithId.attemptBlast(elapsedTime);
            this.keyState[this.config.playerKeys.down] = false;
        }*/

        //update if player is charging, can be cleaned up
        if (this.isRightClicking && this.isRightCharging < 1 && playerWithId.isDead === false && this.rightClickCounter <= 0) this.isRightCharging += elapsedTime * 2;
        else if (this.isRightCharging > 1) this.isRightCharging = 1;

        this.updateObjects(elapsedTime);
        this.updateObjectsSecondary(elapsedTime);

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
        this.projectiles.forEach((projectile) => projectile.render(Game.ctx));
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
        //safeGetElementById("slideBackground").style.left = (this.screenPos * 2 / 3) + "px";
    }

    private setCooldowns(player: Player) { // sets cooldowns based on player class
        if (player.classType === 0) {
            this.leftClickCooldown = 0.2; // ninja shank
            this.rightClickCooldown = 3; // shuriken
        } else if (player.classType === 1) {
            this.leftClickCooldown = 0.4; // Arcane scythe
            this.rightClickCooldown = 0.5; // ice spike
            safeGetElementById('basicAttackImg').setAttribute('src', "images/abilites/staffBasicAttack.png");
            safeGetElementById('secondaryAttackImg').setAttribute('src', "images/abilites/fireballSecondary.png");
        } else if (player.classType === 2) {
            this.leftClickCooldown = 0.4; // hammer bash
            this.rightClickCooldown = 0.5; // shield
            safeGetElementById('basicAttackImg').setAttribute('src', "images/abilites/hammerBasicAttack.png");
            safeGetElementById('secondaryAttackImg').setAttribute('src', "images/abilites/shieldSecondary.png");
        }
    }

    private updateCooldowns(elapsedTime: number, player: Player) { // updates player's cooldown icons
        
        safeGetElementById("health").style.width = player.health * 1.02 + "%";
        if (player.isShielded) safeGetElementById("health").style.background = "cyan";
        else safeGetElementById("health").style.background = "rgb(201, 0, 0)";

        safeGetElementById("charge").style.width = this.isRightCharging * 102 + "%";
        if (this.isRightCharging < 1) safeGetElementById("charge").style.background = "rgb(24, 100, 14)";
        else safeGetElementById("charge").style.background = "rgb(20, 172, 0)";

        if (this.leftClickCounter > 0 ) {
            this.leftClickCounter -= elapsedTime;
            safeGetElementById("basicAttack").style.top = (((this.leftClickCounter / this.leftClickCooldown) * -55 ) - 3 ) + "px";
        } else if (this.leftClickCounter < 0) {
            this.leftClickCounter = 0;
        }

        if (this.rightClickCounter > 0 ) {
            this.rightClickCounter -= elapsedTime;
            safeGetElementById("secondaryAttack").style.top = (((this.rightClickCounter / this.rightClickCooldown) * -50 ) - 3 ) + "px";
        } else if (this.rightClickCounter < 0) {
            this.rightClickCounter = 0;
        }
    }

    private updateObjects(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime, this.players));

        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);

        this.projectiles.forEach((projectile) => projectile.update(elapsedTime));
        this.projectiles = this.projectiles.filter((projectile) => projectile.isDead === false);

    }

    private updateObjectsSecondary(elapsedTime: number) {

        this.players.forEach((player1) => {
            this.platforms.forEach((platform) => {
                player1.checkCollisionWithRectangularObject(platform, elapsedTime);
            });
        });

        this.projectiles.forEach((projectile) => {
            if (!projectile.inGround) {
                this.platforms.forEach((platform) => {
                    projectile.checkCollisionWithRectangularObject(platform, elapsedTime / 4);
                    projectile.checkCollisionWithRectangularObject(platform, elapsedTime / 2);
                    projectile.checkCollisionWithRectangularObject(platform, elapsedTime);
                });
                this.players.forEach((player) => {
                    projectile.checkCollisionWithPlayer(player, elapsedTime);
                });
            }
        });

    }

    private calculateArrow() {
        const playerWithId = this.findPlayer();

        let newX: number = this.mousePos.x - this.screenPos - playerWithId.position.x - this.config.playerSize / 2;
        let newY: number = this.mousePos.y - playerWithId.position.y - this.config.playerSize / 2;
        //changes the player's mouse positions based on their location

        const angle: number = Math.atan(newX / newY);

        newX = Math.sin(angle) * this.config.arrowPower * this.isRightCharging;
        newY = Math.cos(angle) * this.config.arrowPower * this.isRightCharging;

        if (this.mousePos.y - playerWithId.position.y - this.config.playerSize / 2 < 0) {
            newX *= -1;
            newY *= -1;
        }

        playerWithId.focusPosition.x = newX;
        playerWithId.focusPosition.y = newY;

        if (playerWithId.isDead === false) playerWithId.attemptProjectile();
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
        this.projectiles.forEach((projectile) => {
            if (!projectile.inGround) blast.blastProjectile(projectile);
        });
    }

    private arrow(position: Vector, momentum: Vector, id: number) {
        const arrow = new ClientProjectile(this.config, {
            position,
            momentum,
            id,
            inGround: false,
            isDead: false,
        });
        this.projectiles.push(arrow);
    }

}
