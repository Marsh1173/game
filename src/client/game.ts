import { AllInfo } from "../api/allinfo";
import { ServerMessage } from "../api/message";
import { Config } from "../config";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { ClientBlast } from "./blast";
import { ClientProjectile } from "./projectile";
import { ProjectileType } from "../objects/projectile";
import { ClientTargetedProjectile } from "./targetedProjectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { ClientPlatform } from "./platform";
import { ClientPlayer } from "./player";
import { ServerTalker } from "./servertalker";
import { safeGetElementById } from "./util";
import { ParticleSystem } from "./particle";

export class Game {
    private static readonly menuDiv = safeGetElementById("menuDiv");
    private static readonly gameDiv = safeGetElementById("gameDiv");
    private static readonly canvas = safeGetElementById("canvas") as HTMLCanvasElement;
    private static readonly ctx = Game.canvas.getContext("2d")!;
    public static readonly particleHandler = new ParticleSystem();
    private readonly keyState: Record<string, boolean> = {};
    private players: ClientPlayer[] = [];
    private blasts: ClientBlast[] = [];
    private projectiles: ClientProjectile[] = [];
    private targetedProjectiles: ClientTargetedProjectile[] = [];
    private platforms: ClientPlatform[] = [];
    private going: boolean = false;

    private screenPos: number = 0;

    private mousePos: Vector = { x: 0, y: 0 };
    private animationFrame: number = 0;

    //private isLeftClicking: boolean = false;
    private isLeftCharging: number = 0;
    private leftClickCooldown: number = 0;
    private leftClickCounter: number = 0;

    private isRightClicking: boolean = false;
    private isRightCharging: number = 0;
    private rightClickCooldown: number = 0;
    private rightClickCounter: number = 0;

    //private isRightClicking: boolean = false;
    private firstAbilityCharging: number = 0;
    private firstAbilityCooldown: number = 0;
    private firstAbilityCounter: number = 0;

    private constructGame(info: AllInfo) {
        this.platforms = info.platforms.map((platformInfo) => new ClientPlatform(this.config, platformInfo));
        this.blasts = info.blasts.map((blastInfo) => new ClientBlast(this.config, blastInfo));
        this.projectiles = info.projectiles.map((projectileInfo) => new ClientProjectile(this.config, projectileInfo));
        this.targetedProjectiles = info.targetedProjectiles.map((targetedProjectileInfo) => new ClientTargetedProjectile(this.config, targetedProjectileInfo));
        this.players = info.players.map(
            (playerInfo) =>
                new ClientPlayer(
                    this.config,
                    playerInfo,
                    (position: Vector, color: string, id: number) => {
                        this.blast(position, color, id);
                    },
                    (
                        projectileType: ProjectileType,
                        damageType: string,
                        damage: number,
                        id: number,
                        team: number,
                        position: Vector,
                        momentum: Vector,
                        fallSpeed: number,
                        knockback: number,
                        range: number,
                        life: number,
                        inGround: boolean,
                    ) => {
                        this.projectile(projectileType, damageType, damage, id, team, position, momentum, fallSpeed, knockback, range, life, inGround);
                    },
                    (
                        targetedProjectileType: TargetedProjectileType,
                        id: number,
                        team: number,
                        position: Vector,
                        momentum: Vector,
                        destination: Vector,
                        isDead: boolean,
                        life: number,
                    ) => {
                        this.targetedProjectile(targetedProjectileType, id, team, position, momentum, destination, isDead, life);
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
            let player;
            switch (msg.type) {
                case "info":
                    this.constructGame(msg.info);
                    break;
                case "levelUp":
                    player = this.players.find((player) => player.id === msg.id)!;
                    Game.particleHandler.newEffect({
                        particleEffectType: "levelUp",
                        position: { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
                        momentum: player.momentum,
                        direction: { x: 0, y: 0 },
                        color: player.color,
                        targetPosition: player.position,
                    });
                    break;
                case "die":
                    player = this.players.find((player) => player.id === msg.id)!;
                    Game.particleHandler.newEffect({
                        particleEffectType: "die",
                        position: { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
                        momentum: player.momentum,
                        direction: { x: 0, y: 0 },
                        color: player.color,
                    });
                    break;
                case "stealth":
                    player = this.players.find((player) => player.id === msg.id)!;
                    Game.particleHandler.newEffect({
                        particleEffectType: "stealth",
                        position: { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
                        momentum: player.momentum,
                        direction: { x: 0, y: 0 },
                        color: player.color,
                    });
                case "playerLeaving":
                    // We don't do anything here yet
                    break;
                default:
                    throw new Error("Unrecognized message from server");
            }
            if (msg.type === "info") {
                this.constructGame(msg.info);
            }
        };

        // use onkeydown and onkeyup instead of addEventListener because it's possible to add multiple event listeners per event
        // This would cause a bug where each time you press a key it creates multiple blasts or jumps
        safeGetElementById("slider").onmousedown = (e: MouseEvent) => {
            const playerWithId = this.findPlayer();

            if (e.button === 0) {
                //left mouse button click
                this.cancelAbilites();
                this.keyState[config.playerKeys.basicAttack] = true;

            } else if (e.button === 2) {
                //right mouse button click
                this.cancelAbilites();
                this.keyState[config.playerKeys.secondAttack] = true;
            }
        };
        window.onmouseup = (e: MouseEvent) => {
            const playerWithId = this.findPlayer();

            if (e.button === 0 && this.keyState[config.playerKeys.basicAttack]) {
                // left mouse release
                this.isLeftCharging = 0;
                this.keyState[config.playerKeys.basicAttack] = false;
            } else if (e.button === 2 && this.keyState[config.playerKeys.secondAttack]) {
                // right mouse release
                this.keyState[config.playerKeys.secondAttack] = false;
                this.isRightCharging = 0;
            }
        };
        window.onmousemove = (e: MouseEvent) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        };
        window.onkeydown = (e: KeyboardEvent) => {
            if (e.code === "ShiftLeft") {
                if (!this.keyState["ShiftLeft"] && !this.keyState[config.playerKeys.basicAttack]) {
                    const playerWithId = this.findPlayer();
                    this.cancelAbilites();
                    if (!playerWithId.isDead && playerWithId.classType === 2 && this.firstAbilityCounter <= 0) {
                        playerWithId.attemptfirstAbility(this.players, this.platforms);
                        this.firstAbilityCounter = this.firstAbilityCooldown;
                    } else if (playerWithId.classType != 2) {
                        this.keyState[e.code] = true;
                    }
                }
            } else this.keyState[e.code] = true;
        };
        window.onkeyup = (e: KeyboardEvent) => {
            if (e.code === "ShiftLeft") {
                if (this.keyState["ShiftLeft"]) {
                    const playerWithId = this.findPlayer();
                    if (this.firstAbilityCounter <= 0 && this.firstAbilityCharging >= 1) {
                        playerWithId.attemptfirstAbility(this.players, this.platforms);
                        this.firstAbilityCounter = this.firstAbilityCooldown;
                    }
                    this.keyState["ShiftLeft"] = false;
                    this.firstAbilityCharging = 0;
                }
            } else this.keyState[e.code] = false;
        };
    }

    public start() {
        Game.menuDiv.style.display = "none";
        Game.gameDiv.style.display = "block";

        const playerWithId = this.findPlayer();

        safeGetElementById("slideContainer").style.height = this.config.ySize + "px";
        safeGetElementById("slider").style.width = this.config.xSize + "px";
        safeGetElementById("slider").style.left = this.screenPos + "px";
        safeGetElementById("level").style.backgroundColor = playerWithId.color;

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
        this.update(elapsedTime * this.config.gameSpeed);
        if (this.going) {
            window.requestAnimationFrame((timestamp) => this.loop(timestamp));
        }
    }

    private update(elapsedTime: number) {
        const playerWithId = this.findPlayer();

        playerWithId.focusPosition.x = this.mousePos.x - this.screenPos;
        playerWithId.focusPosition.y = this.mousePos.y;
        //playerWithId.animationFrame += (this.animationFrame - playerWithId.animationFrame) / 2;

        this.updateMouse(elapsedTime, playerWithId);

        this.updateHTML(elapsedTime, playerWithId);

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
        if (this.keyState[this.config.playerKeys.basicAttack] && this.leftClickCounter <= 0) {
            this.leftClickCounter = this.leftClickCooldown;
            playerWithId.attemptBasicAttack(this.players);
        }
        if (this.keyState[this.config.playerKeys.secondAttack] && this.rightClickCounter <= 0) {

            if (playerWithId.classType != 1 && this.rightClickCounter <= 0) {
                playerWithId.attemptSecondaryAttack(this.players);
                this.rightClickCounter = this.rightClickCooldown;
                this.isRightCharging = 0;
            } else if (playerWithId.classType === 1 && this.rightClickCounter <= 0 && this.isRightCharging >= 1) {
                playerWithId.attemptSecondaryAttack(this.players);
                this.rightClickCounter = this.rightClickCooldown;
                this.isRightCharging = 0;
            }
        }

        Game.particleHandler.update(elapsedTime, this.platforms);

        /*if (this.keyState[this.config.playerKeys.down]) {
            playerWithId.attemptBlast(elapsedTime);
            this.keyState[this.config.playerKeys.down] = false;
        }*/

        this.updateObjects(elapsedTime);

        this.render();
    }

    private findPlayer() {
        const playerWithId = this.players.find((player) => player.id === this.id);
        if (!playerWithId) {
            throw new Error("Player with my id does not exist in data from server");
        }
        return playerWithId;
    }

    private cancelAbilites() {
        this.keyState[this.config.playerKeys.secondAttack] = false;
        this.keyState[this.config.playerKeys.basicAttack] = false;
        this.keyState["ShiftLeft"] = false;

        this.animationFrame = 0;

        this.isLeftCharging = 0;
        this.isRightCharging = 0;
        this.firstAbilityCharging = 0;
    }

    private updateMouse(elapsedTime: number, player: Player) {
        if (player.isDead) {
            this.isRightCharging = 0;
            this.isLeftCharging = 0;
            this.firstAbilityCharging = 0;
        } else {
            if (this.keyState[this.config.playerKeys.secondAttack] && this.rightClickCounter <= 0) {
                if (this.isRightCharging < 1) this.isRightCharging += elapsedTime * 2;
                else if (this.isRightCharging > 1) this.isRightCharging = 1;
            } else if (this.keyState[this.config.playerKeys.basicAttack] && this.leftClickCounter <= 0) {
                if (this.isLeftCharging < 1) this.isLeftCharging += elapsedTime * 2;
                else if (this.isLeftCharging > 1) this.isLeftCharging = 1;
            } else if (this.keyState["ShiftLeft"] && this.firstAbilityCounter <= 0) {
                if (this.firstAbilityCharging < 1) this.firstAbilityCharging += elapsedTime * 2;
                else if (this.firstAbilityCharging > 1) this.firstAbilityCharging = 1;
            }
        }
    }

    private render() {
        Game.ctx.clearRect(0, 0, this.config.xSize, this.config.ySize);

        const playerWithId = this.findPlayer();
        if (!playerWithId.isStealthed && Game.canvas.style.background != "#2e3133") Game.canvas.style.background = "#2e3133";
        else if (playerWithId.isStealthed && Game.canvas.style.background != "#191b1c") Game.canvas.style.background = "#191b1c";

        this.players.forEach((player) => {
            if (!player.isStealthed) player.render(Game.ctx);
        });

        this.projectiles.forEach((projectile) => projectile.render(Game.ctx, Game.particleHandler));
        this.targetedProjectiles.forEach((targetedProjectile) => targetedProjectile.render(Game.ctx, Game.particleHandler));
        this.platforms.forEach((platform) => platform.render(Game.ctx));

        this.players.forEach((player) => {
            if (this.id === player.id && !player.isDead) {
                if (this.keyState["ShiftLeft"]) player.renderFirstAbilityPointer(Game.ctx, this.platforms);
            }
            if (!player.isDead && !player.isStealthed) {
                player.renderWeapon(Game.ctx);
            }
        });
        this.players.forEach((player) => {
            if (!player.isStealthed && !player.isDead) player.renderHealth(Game.ctx);
            if (!player.isStealthed && !player.isDead && player.classType >= 0) player.renderName(Game.ctx);
            //player.renderFocus(Game.ctx); //FOR DEBUGGING
        });
        if (playerWithId.isStealthed) {
            playerWithId.renderInvisiblePlayer(Game.ctx);
        }

        Game.particleHandler.render(Game.ctx);
    }

    private updateSlider() {
        const playerWithId = this.findPlayer();

        //check if screen is bigger than field
        if (this.config.xSize < window.innerWidth - 20) {
            this.screenPos = 0;
        } else {
            let temp = this.screenPos + (-playerWithId.position.x + window.innerWidth / 2 - this.screenPos) / 7;
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

    private setCooldowns(player: ClientPlayer) {
        // sets cooldowns based on player class
        if (player.classType === 0) {
            this.leftClickCooldown = 0.2; // ninja shank
            this.rightClickCooldown = 3; // shuriken
            this.firstAbilityCooldown = 12; // stealth
            safeGetElementById("basicAttackImg").setAttribute("src", "images/abilites/swordBasicAttack.png");
            safeGetElementById("secondaryAttackImg").setAttribute("src", "images/abilites/shurikenSecondary.png");
            safeGetElementById("firstAbilityImg").setAttribute("src", "images/abilites/stealth.png");
        } else if (player.classType === 1) {
            this.leftClickCooldown = 0.3; // fireball
            this.rightClickCooldown = 4; // ice spike
            this.firstAbilityCooldown = 4.5; // //firestrike
            safeGetElementById("basicAttackImg").setAttribute("src", "images/abilites/fireballBasicAttack.png");
            safeGetElementById("secondaryAttackImg").setAttribute("src", "images/abilites/iceSecondary.png");
            safeGetElementById("firstAbilityImg").setAttribute("src", "images/abilites/firestrike.png");
        } else if (player.classType === 2) {
            this.leftClickCooldown = 0.3; // hammer bash
            this.rightClickCooldown = 1.5; // shield bash
            this.firstAbilityCooldown = 2.5; //
            safeGetElementById("basicAttackImg").setAttribute("src", "images/abilites/hammerBasicAttack.png");
            safeGetElementById("secondaryAttackImg").setAttribute("src", "images/abilites/shieldSecondary.png");
            safeGetElementById("firstAbilityImg").setAttribute("src", "images/abilites/chains.png");
        }

        this.isRightCharging = 0;
        safeGetElementById("charge").style.width = this.isRightCharging * 102 + "%";
    }

    private updateHTML(elapsedTime: number, player: Player) {
        // updates player's cooldown icons

        safeGetElementById("health").style.width = (player.health / (100 + player.healthModifier)) * 102 + "%";
        if (player.isShielded) safeGetElementById("health").style.background = "cyan";
        else safeGetElementById("health").style.background = "rgb(201, 0, 0)";

        safeGetElementById("healthText").innerText = Math.round(player.health) + " / " + (100 + player.healthModifier);

        safeGetElementById("charge").style.background = "rgb(20, 200, 0)";
        if (this.isRightCharging > 0) {
            safeGetElementById("charge").style.width = this.isRightCharging * 102 + "%";
            if (this.isRightCharging < 1) safeGetElementById("charge").style.background = "rgb(24, 100, 14)";
        } else if (this.firstAbilityCharging > 0) {
            safeGetElementById("charge").style.width = this.firstAbilityCharging * 102 + "%";
            if (this.firstAbilityCharging < 1) safeGetElementById("charge").style.background = "rgb(24, 100, 14)";
        } else {
            safeGetElementById("charge").style.width = "0%";
        }

        if (this.leftClickCounter > 0) {
            this.leftClickCounter -= elapsedTime;
            safeGetElementById("basicAttack").style.top = (this.leftClickCounter / this.leftClickCooldown) * -55 - 3 + "px";
        } else if (this.leftClickCounter < 0) {
            this.leftClickCounter = 0;
        }

        if (this.rightClickCounter > 0) {
            this.rightClickCounter -= elapsedTime;
            safeGetElementById("secondaryAttack").style.top = (this.rightClickCounter / this.rightClickCooldown) * -50 - 3 + "px";
        } else if (this.rightClickCounter < 0) {
            this.rightClickCounter = 0;
        }

        if (this.firstAbilityCounter > 0) {
            this.firstAbilityCounter -= elapsedTime;
            safeGetElementById("firstAbility").style.top = (this.firstAbilityCounter / this.firstAbilityCooldown) * -50 - 3 + "px";
        } else if (this.firstAbilityCounter < 0) {
            this.firstAbilityCounter = 0;
        }

        safeGetElementById("level").innerText = player.level.toString();
    }

    private updateObjects(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime, this.players, this.platforms));
        this.players = this.players.filter((player) => player.deathCooldown > 0 || player.classType >= 0);

        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);

        this.projectiles.forEach((projectile) => projectile.update(elapsedTime, this.players, this.platforms));
        this.projectiles = this.projectiles.filter((projectile) => projectile.life >= 0);

        this.targetedProjectiles.forEach((targetedProjectile) => targetedProjectile.update(elapsedTime, this.players, this.platforms));
        this.targetedProjectiles = this.targetedProjectiles.filter((targetedProjectile) => !targetedProjectile.isDead);

        this.players.forEach((player1) => {
            this.platforms.forEach((platform) => {
                player1.checkCollisionWithRectangularObject(platform, elapsedTime);
            });
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

    private projectile(
        projectileType: ProjectileType,
        damageType: string,
        damage: number,
        id: number,
        team: number,
        position: Vector,
        momentum: Vector,
        fallSpeed: number,
        knockback: number,
        range: number,
        life: number,
        inGround: boolean,
    ) {
        const projectile = new ClientProjectile(this.config, {
            projectileType,
            damageType,
            damage,
            id,
            team,
            position,
            momentum,
            fallSpeed,
            knockback,
            range,
            life,
            inGround,
        });
        this.projectiles.push(projectile);
    }

    private targetedProjectile(
        targetedProjectileType: TargetedProjectileType,
        id: number,
        team: number,
        position: Vector,
        momentum: Vector,
        destination: Vector,
        isDead: boolean,
        life: number,
    ) {
        const targetedProjectile = new ClientTargetedProjectile(this.config, {
            targetedProjectileType,
            id,
            team,
            position,
            momentum,
            destination,
            isDead,
            life,
        });
        this.targetedProjectiles.push(targetedProjectile);
    }
}
