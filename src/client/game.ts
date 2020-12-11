import { AllInfo } from "../api/allinfo";
import { ServerMessage } from "../api/message";
import { Config } from "../config";
import { DamageType, Player } from "../objects/player";
import { Vector } from "../vector";
import { ClientProjectile } from "./projectile";
import { ProjectileType } from "../objects/projectile";
import { ClientTargetedProjectile } from "./targetedProjectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { ClientPlatform } from "./platform";
import { ClientPlayer } from "./player";
import { ServerTalker } from "./servertalker";
import { safeGetElementById } from "./util";
import { ParticleSystem } from "./particle";
import { isPlayerClassType } from "../classtype";
import { PlayerTooltip } from "../abilityTooltips";
import { renderPlayerOrItemFocus } from "./playerRenderData";
import { ClientItem } from "./item";
import { getRandomWeapon, ItemType } from "../objects/item";
import { moveEmitHelpers } from "typescript";
import { cancelAbilites } from "../objects/abilities";

export class Game {
    private static readonly menuDiv = safeGetElementById("menuDiv");
    private static readonly gameDiv = safeGetElementById("gameDiv");
    private static readonly canvas = safeGetElementById("canvas") as HTMLCanvasElement;
    private static readonly ctx = Game.canvas.getContext("2d")!;

    private slideContainer = safeGetElementById("slideContainer");
    //private level = safeGetElementById("level");

    public static readonly particleHandler = new ParticleSystem();
    private readonly keyState: Record<string, boolean> = {};
    private players: ClientPlayer[] = [];
    private projectiles: ClientProjectile[] = [];
    private targetedProjectiles: ClientTargetedProjectile[] = [];
    private items: ClientItem[] = [];
    private platforms: ClientPlatform[] = [];
    private going: boolean = false;

    private globalElapsedTime: number = 0;

    private screenPos: Vector = {x: 0, y: 0};

    private mousePos: Vector = { x: 0, y: 0 };

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
        this.projectiles = info.projectiles.map((projectileInfo) => new ClientProjectile(this.config, projectileInfo));
        this.targetedProjectiles = info.targetedProjectiles.map((targetedProjectileInfo) => new ClientTargetedProjectile(this.config, targetedProjectileInfo));
        this.players = info.players.map(
            (playerInfo) =>
                new ClientPlayer(
                    this.config,
                    playerInfo,
                    (
                        projectileType: ProjectileType,
                        damageType: DamageType,
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
                    (
                        itemType: ItemType,
                        position: Vector,
                        momentum: Vector,
                        life: number,
                    ) => {
                        this.item(itemType, position, momentum, life);
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
                case "serverDie":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.die = true;
                    Game.particleHandler.newEffect({
                        particleEffectType: "die",
                        position: { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
                        momentum: player.momentum,
                        direction: { x: 0, y: 0 },
                        color: player.color,
                    });
                    break;
                case "serverBasicAttack":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.basicAttack = true;
                    break;
                case "serverSecondaryAttack":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.secondaryAttack = true;
                    break;
                case "serverFirstAbility":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.firstAbility = true;
                    Game.particleHandler.newEffect({
                        particleEffectType: "stealth",
                        position: { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
                        momentum: player.momentum,
                        direction: { x: 0, y: 0 },
                        color: player.color,
                    }); // there should be an abilities effects folder
                    break;
                case "serverSecondAbility":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.secondAbility = true;
                    break;
                case "serverThirdAbility":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.thirdAbility = true;
                    break;
                case "serverMoveRight":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.moveRight = true;
                    break;
                case "serverMoveLeft":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.moveLeft = true;
                    break;
                case "serverJump":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player.id != this.id) player.actionsNextFrame.jump = true;
                    break;
                case "serverPlayerUpdate":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (msg.id != this.id) {
                        player.focusPosition = msg.focusPosition;
                        player.position = msg.position;
                        player.health = msg.health;
                    }
                    break;
                case "playerInfo":
                    this.players.push(new ClientPlayer(
                                this.config,
                                msg.info,
                                (
                                    projectileType: ProjectileType,
                                    damageType: DamageType,
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
                                (
                                    itemType: ItemType,
                                    position: Vector,
                                    momentum: Vector,
                                    life: number,
                                ) => {
                                    this.item(itemType, position, momentum, life);
                                },
                                this.serverTalker,
                                this.id,
                            ),
                    );
                    break;
                case "playerLeaving":
                    // We don't do anything here yet TODO - FILTER THIS.PLAYERS
                    this.players = this.players.filter((player) => player.id !== msg.id);
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
        window.onmousedown = (e: MouseEvent) => {
            const playerWithId = this.findPlayer();

            if (e.button === 0) {
                //left mouse button click
                this.cancelAbilites();
                this.keyState[config.playerKeys.basicAttack] = true;

            } else if (e.button === 2) {
                cancelAbilites(playerWithId);
                playerWithId.abilities[1].isCharging = true;
            }
        };
        window.onmouseup = (e: MouseEvent) => {
            const playerWithId = this.findPlayer();

            if (e.button === 0 && this.keyState[config.playerKeys.basicAttack]) {
                // left mouse release
                this.isLeftCharging = 0;
                this.keyState[config.playerKeys.basicAttack] = false;
            } else if (e.button === 2) {
                playerWithId.abilities[1].isCharging = false;
            }
        };
        window.onmousemove = (e: MouseEvent) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        };
        window.onkeydown = (e: KeyboardEvent) => {
            const playerWithId = this.findPlayer();

            if (e.code === this.config.playerKeys.firstAbility && !playerWithId.abilities[2].isCharging) {
                cancelAbilites(playerWithId);
                playerWithId.abilities[2].isCharging = true;
            } else if (e.code === this.config.playerKeys.secondAbility && !playerWithId.abilities[3].isCharging) {
                cancelAbilites(playerWithId);
                playerWithId.abilities[3].isCharging = true;
            } else if (e.code === this.config.playerKeys.thirdAbility && !playerWithId.abilities[4].isCharging) {
                cancelAbilites(playerWithId);
                playerWithId.abilities[4].isCharging = true;
            } else this.keyState[e.code] = true;
        };
        window.onkeyup = (e: KeyboardEvent) => {
            const playerWithId = this.findPlayer();
            if (e.code === this.config.playerKeys.firstAbility) {
                playerWithId.abilities[2].isCharging = false;
            } else if (e.code === this.config.playerKeys.secondAbility) {
                playerWithId.abilities[3].isCharging = false;
            } else if (e.code === this.config.playerKeys.thirdAbility) {
                playerWithId.abilities[4].isCharging = false;
            } else this.keyState[e.code] = false;
        };
    }

    public start() {
        Game.menuDiv.style.display = "none";
        Game.gameDiv.style.display = "block";

        const playerWithId = this.findPlayer();

        // safeGetElementById("slideContainer").style.height = this.config.ySize + "px";
        //safeGetElementById("canvas").style.height = this.config.ySize + "px";
        this.slideContainer.style.height = (window.innerHeight - 150) + "px";
        safeGetElementById("slider").style.width = this.config.xSize + "px";
        safeGetElementById("slider").style.left = this.screenPos.x + "px";
        //this.level.style.backgroundColor = playerWithId.color;

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
        this.globalElapsedTime = elapsedTime;
        this.lastFrame = timestamp;
        this.update(elapsedTime * this.config.gameSpeed);
        if (this.going) {
            window.requestAnimationFrame((timestamp) => this.loop(timestamp));
        }
    }

    private update(elapsedTime: number) {
        elapsedTime = Math.min(0.03, elapsedTime);//hotfix to make sure sudden lag spikes dont clip them through the floors

        const playerWithId = this.findPlayer();
        /*if (playerWithId.actionsNextFrame.die) {
            playerWithId.attemptDie();
        }*/

        playerWithId.focusPosition.x = this.mousePos.x - this.screenPos.x;
        playerWithId.focusPosition.y = this.mousePos.y - this.screenPos.y;

        this.serverTalker.sendMessage({
            type: "playerUpdate",
            id: this.id,
            focusPosition: {x: this.mousePos.x - this.screenPos.x, y: this.mousePos.y - this.screenPos.y},
            health: playerWithId.health,
            position: playerWithId.position,
        });

        this.updateMouse(elapsedTime, playerWithId);

        this.updateHTML(elapsedTime, playerWithId);

        this.updateSliderX();
        this.updateSliderY();

        if (this.keyState[this.config.playerKeys.up]) {
            playerWithId.actionsNextFrame.jump = true;
            //playerWithId.attemptJump();
            this.keyState[this.config.playerKeys.up] = false;
            this.serverTalker.sendMessage({
                type: "action",
                actionType: "jump",
                id: this.id,
            });
        }
        if (this.keyState[this.config.playerKeys.left]) {
            playerWithId.actionsNextFrame.moveLeft = true;
            //playerWithId.attemptMoveLeft(elapsedTime);
            this.serverTalker.sendMessage({
                type: "action",
                actionType: "moveLeft",
                id: this.id,
            });
        }
        if (this.keyState[this.config.playerKeys.right]) {
            playerWithId.actionsNextFrame.moveRight = true;
            //playerWithId.attemptMoveRight(elapsedTime);
            this.serverTalker.sendMessage({
                type: "action",
                actionType: "moveRight",
                id: this.id,
            });
        }
        if (this.keyState[this.config.playerKeys.basicAttack] && this.leftClickCounter <= 0) {
            this.leftClickCounter = this.leftClickCooldown;
            playerWithId.actionsNextFrame.basicAttack = true;
            /*this.serverTalker.sendMessage({
                type: "action",
                actionType: "basicAttack",
                id: this.id,
            });*/
        }
        /*if (this.keyState[this.config.playerKeys.secondAttack] && this.rightClickCounter <= 0) {
            playerWithId.actionsNextFrame.secondaryAttack = true;
            this.serverTalker.sendMessage({
                type: "action",
                actionType: "secondaryAttack",
                id: this.id,
            });
        }
        if (this.keyState[this.config.playerKeys.firstAbility]) {
            playerWithId.actionsNextFrame.firstAbility = true;
            this.serverTalker.sendMessage({
                type: "action",
                actionType: "firstAbility",
                id: this.id,
            });
        }
        if (this.keyState[this.config.playerKeys.secondAbility]) {
            playerWithId.actionsNextFrame.secondAbility = true;
            this.serverTalker.sendMessage({
                type: "action",
                actionType: "secondAbility",
                id: this.id,
            });
        }
        if (this.keyState[this.config.playerKeys.thirdAbility]) {
            playerWithId.actionsNextFrame.thirdAbility = true;
            this.serverTalker.sendMessage({
                type: "action",
                actionType: "thirdAbility",
                id: this.id,
            });
        }*/

        Game.particleHandler.update(elapsedTime, this.platforms);

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
        Game.ctx.fillStyle = "#2e3133";
        Game.ctx.fillRect(0, 0, this.config.xSize, this.config.ySize);

        Game.ctx.setTransform(1, 0, 0, 1, this.screenPos.x, this.screenPos.y);

        const playerWithId = this.findPlayer();

        this.players.forEach((player) => {
            if ((!player.effects.isStealthed || this.id === player.id) && !player.isDead) player.render(Game.ctx);
        });

        this.projectiles.forEach((projectile) => projectile.render(Game.ctx, Game.particleHandler));
        this.targetedProjectiles.forEach((targetedProjectile) => targetedProjectile.render(Game.ctx, Game.particleHandler));
        

        this.players.forEach((player) => {
            if (this.id === player.id && !player.isDead) {
                if (this.keyState["ShiftLeft"]) player.renderFirstAbilityPointer(Game.ctx, this.platforms);
            }
            if (!player.isDead && (!player.effects.isStealthed || player.id === this.id)) {
                player.renderWeapon(Game.ctx);
            }
        });
        this.players.forEach((player) => {
            if (!player.effects.isStealthed && !player.isDead) player.renderHealth(Game.ctx);
            if (!player.effects.isStealthed && !player.isDead && isPlayerClassType(player.classType)) {
                if (player === playerWithId) player.renderName(Game.ctx, "cyan");
                else if (player.team === playerWithId.team) player.renderName(Game.ctx, "white");
                else player.renderName(Game.ctx, "red");
            }
            //player.renderFocus(Game.ctx); //FOR DEBUGGING
        });

        this.items.forEach((item) => {
            item.render(Game.ctx);
        });

        Game.particleHandler.render(Game.ctx);

        renderPlayerOrItemFocus(Game.ctx, playerWithId, this.players, this.items);


        this.platforms.forEach((platform) => platform.render(Game.ctx));
        if (playerWithId.effects.isStealthed) {
            playerWithId.renderLimitedVision(Game.ctx, 500); //dark invisible screen
        } else if (playerWithId.isDead) {
            playerWithId.renderLimitedVision(Game.ctx, playerWithId.deathCooldown * 4); //shrinking death screen
            
        }

        playerWithId.renderUI(Game.ctx, this.screenPos);
        
    }

    private updateSliderX() {
        const playerWithId = this.findPlayer();

        //check if screen is bigger than field
        if (this.config.xSize < window.innerWidth) {
            this.screenPos.x = 0;
        } else {
            let temp = this.screenPos.x + (-playerWithId.position.x + window.innerWidth / 2 - this.screenPos.x) / 20;
            //make a temp position to check where it would be updated to
            if (this.screenPos.x < temp + 1 && this.screenPos.x > temp - 1) {
                return; //so it's not updating even while idle
            }

            if (temp > 0) {
                // if they're too close to the left wall
                if (this.screenPos.x === 0) return;
                this.screenPos.x = 0;
            } else if (temp < -(this.config.xSize - window.innerWidth)) {
                // or the right wall
                if (this.screenPos.x === -(this.config.xSize - window.innerWidth)) return;
                this.screenPos.x = -(this.config.xSize - window.innerWidth);
            } else {
                if (this.screenPos.x > temp + 1 || this.screenPos.x < temp - 1) {
                    this.screenPos.x = temp; // otherwise the predicted position is fine
                }
            }
        }
        //safeGetElementById("slider").style.left = this.screenPosX + "px"; CANVAS NOW UPDATED IN RENDER INSTEAD OF CHANGING THE SLIDER POS
    }

    private updateSliderY() {
        const playerWithId = this.findPlayer();

        //check if screen is bigger than field
        if (this.config.ySize < (window.innerHeight)) {
            this.screenPos.y = 0;//window.innerHeight - this.config.ySize;
        } else {
            let temp = this.screenPos.y + (-playerWithId.position.y + (window.innerHeight) / 2 - this.screenPos.y) / 20;
            //make a temp position to check where it would be updated to
            if (this.screenPos.y < temp + 1 && this.screenPos.y > temp - 1) {
                return; //so it's not updating even while idle
            }

            if (temp > 0) {
                // if they're too close to the left wall
                if (this.screenPos.y === 0) return;
                this.screenPos.y = 0;
            } else if (temp < -(this.config.ySize - (window.innerHeight))) {
                // or the right wall
                if (this.screenPos.y === -(this.config.ySize - (window.innerHeight))) return;
                this.screenPos.y = -(this.config.ySize - (window.innerHeight));
            } else {
                if (this.screenPos.y > temp + 1 || this.screenPos.y < temp - 1) {
                    this.screenPos.y = temp; // otherwise the predicted position is fine
                }
            }
        }

        //safeGetElementById("slider").style.top = this.screenPosY + "px"; CANVAS NOW UPDATED IN RENDER INSTEAD OF CHANGING THE SLIDER POS
    }

    private setCooldowns(player: ClientPlayer): void {
        // sets cooldowns based on player class
        /*if (player.classType === "ninja") {
            this.leftClickCooldown = 0.3; // ninja shank
            this.rightClickCooldown = 2.5; // shuriken
            this.firstAbilityCooldown = 10; // stealth
            safeGetElementById("basicAttackImg").setAttribute("src", "images/abilites/swordBasicAttack.png");
            safeGetElementById("secondaryAttackImg").setAttribute("src", "images/abilites/shurikenSecondary.png");
            safeGetElementById("firstAbilityImg").setAttribute("src", "images/abilites/stealth.png");
            safeGetElementById("basicAttackTooltip").innerHTML = PlayerTooltip.NinjaBasicAttack;
            safeGetElementById("secondaryAttackTooltip").innerHTML = PlayerTooltip.NinjaSecondaryAttack;
            safeGetElementById("firstAbilityTooltip").innerHTML = PlayerTooltip.NinjaFirstAbility;

        } else if (player.classType === "wizard") {
            this.leftClickCooldown = 0.4; // fireball
            this.rightClickCooldown = 6; // ice spike - 3.5
            this.firstAbilityCooldown = 4.5; // //firestrike
            safeGetElementById("basicAttackImg").setAttribute("src", "images/abilites/fireballBasicAttack.png");
            safeGetElementById("secondaryAttackImg").setAttribute("src", "images/abilites/iceSecondary.png");
            safeGetElementById("firstAbilityImg").setAttribute("src", "images/abilites/firestrike.png");
            safeGetElementById("basicAttackTooltip").innerHTML = PlayerTooltip.WizardBasicAttack;
            safeGetElementById("secondaryAttackTooltip").innerHTML = PlayerTooltip.WizardSecondaryAttack;
            safeGetElementById("firstAbilityTooltip").innerHTML = PlayerTooltip.WizardFirstAbility;

        } else if (player.classType === "warrior") {
            this.leftClickCooldown = 0.35; // hammer bash
            this.rightClickCooldown = 2.5; // shield bash
            this.firstAbilityCooldown = 3.5; // chains or healing aura
            safeGetElementById("basicAttackImg").setAttribute("src", "images/abilites/hammerBasicAttack.png");
            safeGetElementById("secondaryAttackImg").setAttribute("src", "images/abilites/shieldSecondary.png");
            safeGetElementById("firstAbilityImg").setAttribute("src", "images/abilites/chains.png");
            safeGetElementById("basicAttackTooltip").innerHTML = PlayerTooltip.WarriorBasicAttack;
            safeGetElementById("secondaryAttackTooltip").innerHTML = PlayerTooltip.WarriorSecondaryAttack;
            safeGetElementById("firstAbilityTooltip").innerHTML = PlayerTooltip.WarriorFirstAbility;
        }

        this.isRightCharging = 0;
        safeGetElementById("charge").style.width = this.isRightCharging * 102 + "%";*/
    }

    private updateHTML(elapsedTime: number, player: Player) {
        // updates player's cooldown icons

        //safeGetElementById("xp").style.width = (player.XP / (player.XPuntilNextLevel)) * 102 + "%";

        /*safeGetElementById("health").style.width = (player.health / (100 + player.healthModifier)) * 102 + "%";
        if (player.effects.isShielded) safeGetElementById("health").style.background = "cyan";
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

        if (player.level.toString() != this.level.innerText) this.level.innerText = player.level.toString();*/
        if (parseInt(this.slideContainer.style.height, 10) != window.innerHeight) this.slideContainer.style.height = (window.innerHeight) + "px";
    }

    private updateObjects(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime * player.effects.isSlowed, this.players, this.platforms, this.items, (player.id === this.id)));

        this.items.forEach((item) => item.update(elapsedTime, this.platforms));
        this.items = this.items.filter((item) => item.life >= 0);

        this.projectiles.forEach((projectile) => projectile.update(elapsedTime, this.players, this.platforms));
        this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);

        this.targetedProjectiles = this.targetedProjectiles.filter((targetedProjectile) => !targetedProjectile.isDead);
        this.targetedProjectiles.forEach((targetedProjectile) => targetedProjectile.update(elapsedTime, this.players, this.platforms, this.projectiles));
    }

    private projectile(
        projectileType: ProjectileType,
        damageType: DamageType,
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

    private item (
        itemType: ItemType,
        position: Vector,
        momentum: Vector,
        life: number,
    ) {
        const item = new ClientItem(this.config, {
            itemType,
            position,
            momentum,
            life,
        });
        this.items.push(item);
    }
}
