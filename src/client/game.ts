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
    public static particleAmount: number;

    private slideContainer = safeGetElementById("slideContainer");

    public static readonly particleHandler = new ParticleSystem();
    private readonly keyState: Record<string, boolean> = {};
    private players: ClientPlayer[] = [];
    private projectiles: ClientProjectile[] = [];
    private targetedProjectiles: ClientTargetedProjectile[] = [];
    private items: ClientItem[] = [];
    private platforms: ClientPlatform[] = [];
    private going: boolean = false;

    private screenPos: Vector = {x: 0, y: 0};
    private mousePos: Vector = { x: 0, y: 0 };

    private constructGame(info: AllInfo) {
        this.platforms = info.platforms.map((platformInfo) => new ClientPlatform(this.config, platformInfo));
        this.items = info.items.map((itemInfo) => new ClientItem(this.config, itemInfo));
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
                        id: number,
                        position: Vector,
                        momentum: Vector,
                        life: number,
                    ) => {
                        this.item(itemType, id, position, momentum, life);
                    },
                    this.serverTalker,
                    this.id,
                ),
        );
    }

    constructor(info: AllInfo, private readonly config: Config, private readonly id: number, private readonly serverTalker: ServerTalker, particleAmount: number) {
        Game.canvas.style.width = this.config.xSize + "px";
        Game.canvas.style.height = this.config.ySize + "px";
        Game.canvas.width = this.config.xSize;
        Game.canvas.height = this.config.ySize;
        Game.particleAmount = particleAmount / 100;

        this.constructGame(info);

        this.serverTalker.messageHandler = (msg: ServerMessage) => {
            let player;
            switch (msg.type) {
                case "info":
                    this.constructGame(msg.info);
                    break;
                case "serverPlayerActions":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player && msg.id != this.id) {
                        player.actionsNextFrame.moveRight = msg.moveRight;
                        player.actionsNextFrame.moveLeft = msg.moveLeft;
                        player.actionsNextFrame.jump = msg.jump;
                        player.actionsNextFrame.basicAttack = msg.basicAttack;
                        player.actionsNextFrame.secondaryAttack = msg.secondaryAttack;
                        player.actionsNextFrame.firstAbility = msg.firstAbility;
                        player.actionsNextFrame.secondAbility = msg.secondAbility;
                        player.actionsNextFrame.thirdAbility = msg.thirdAbility;
                        player.actionsNextFrame.die = msg.die;
                        player.actionsNextFrame.level = msg.level;
                        
                        player.focusPosition = msg.focusPosition;
                        player.position = msg.position;
                        player.health = msg.health;
                    }

                    if (msg.die) {
                        Game.particleHandler.newEffect({
                            particleEffectType: "die",
                            position: { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
                            momentum: player.momentum,
                            direction: { x: 0, y: 0 },
                            color: player.color,
                        });
                    }

                    if (msg.level && player.id === this.id) {
                        Game.particleHandler.newEffect({
                            particleEffectType: "levelUp",
                            position: { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
                            momentum: player.momentum,
                            direction: { x: 0, y: 0 },
                            color: player.color,
                            targetPosition: player.position,
                        });
                    }

                    break;
                case "serverPlayerUpdateStats":
                    player = this.players.find((player) => player.id === msg.id)!;
                    if (player && msg.id != this.id) {
                        player.abilityNames = msg.abilityNames;
                        player.weaponEquipped = msg.weaponEquipped;
                        player.playerUpdateAbilityStats();
                    }
                    break;
                case "serverItemKillMessage":
                    var item = this.items.find((item) => item.id === msg.id);
                    if (item) item.life = 0;
                    break;
                case "serverItemMessage":
                    this.item(msg.itemType, msg.id, msg.position, msg.momentum, msg.life);
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
                                    id: number,
                                    position: Vector,
                                    momentum: Vector,
                                    life: number,
                                ) => {
                                    this.item(itemType, id, position, momentum, life);
                                },
                                this.serverTalker,
                                this.id,
                            ),
                    );
                    break;
                case "playerLeaving":
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
                cancelAbilites(playerWithId);
                this.interpretLeftClick(playerWithId);

            } else if (e.button === 2) {
                cancelAbilites(playerWithId);
                playerWithId.playerAbilities[1].isCharging = true;
            }
        };
        window.onmouseup = (e: MouseEvent) => {
            const playerWithId = this.findPlayer();

            if (e.button === 0) {
                // left mouse release
                playerWithId.playerAbilities[0].isCharging = false;
            } else if (e.button === 2) {
                playerWithId.playerAbilities[1].isCharging = false;
            }
        };
        window.onmousemove = (e: MouseEvent) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        };
        window.onkeydown = (e: KeyboardEvent) => {
            const playerWithId = this.findPlayer();

            if (e.code === this.config.playerKeys.firstAbility && !playerWithId.playerAbilities[2].isCharging) {
                cancelAbilites(playerWithId);
                playerWithId.playerAbilities[2].isCharging = true;
            } else if (e.code === this.config.playerKeys.secondAbility && !playerWithId.playerAbilities[3].isCharging) {
                cancelAbilites(playerWithId);
                playerWithId.playerAbilities[3].isCharging = true;
            } else if (e.code === this.config.playerKeys.thirdAbility && !playerWithId.playerAbilities[4].isCharging) {
                cancelAbilites(playerWithId);
                playerWithId.playerAbilities[4].isCharging = true;
            } else this.keyState[e.code] = true;
        };
        window.onkeyup = (e: KeyboardEvent) => {
            const playerWithId = this.findPlayer();
            if (e.code === this.config.playerKeys.firstAbility) {
                playerWithId.playerAbilities[2].isCharging = false;
            } else if (e.code === this.config.playerKeys.secondAbility) {
                playerWithId.playerAbilities[3].isCharging = false;
            } else if (e.code === this.config.playerKeys.thirdAbility) {
                playerWithId.playerAbilities[4].isCharging = false;
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
        this.lastFrame = timestamp;
        this.update(elapsedTime * this.config.gameSpeed);
        if (this.going) {
            window.requestAnimationFrame((timestamp) => this.loop(timestamp));
        }
    }

    private update(elapsedTime: number) {
        elapsedTime = Math.min(0.03, elapsedTime);//hotfix to make sure sudden lag spikes dont clip them through the floors

        const playerWithId = this.findPlayer();

        playerWithId.focusPosition.x = this.mousePos.x - this.screenPos.x;
        playerWithId.focusPosition.y = this.mousePos.y - this.screenPos.y;

        this.updateHTML(elapsedTime, playerWithId);

        this.updateSliderX();
        this.updateSliderY();

        if (this.keyState[this.config.playerKeys.up]) {
            playerWithId.actionsNextFrame.jump = true;
            this.keyState[this.config.playerKeys.up] = false;
        }
        if (this.keyState[this.config.playerKeys.left]) {
            playerWithId.actionsNextFrame.moveLeft = true;
        }
        if (this.keyState[this.config.playerKeys.right]) {
            playerWithId.actionsNextFrame.moveRight = true;
        }

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
            /*if (this.id === player.id && !player.isDead) {
                if (this.keyState["ShiftLeft"]) player.renderFirstAbilityPointer(Game.ctx, this.platforms);
            }*/
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

        renderPlayerOrItemFocus(Game.ctx, playerWithId, this.items);


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
    }

    private updateHTML(elapsedTime: number, player: Player) {
        if (parseInt(this.slideContainer.style.height, 10) != window.innerHeight) this.slideContainer.style.height = (window.innerHeight) + "px";
    }

    private updateObjects(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime * player.effects.isSlowed, this.players, this.platforms, this.items, (player.id === this.id)));

        this.items.forEach((item) => item.update(elapsedTime, this.platforms, this.items));
        this.items = this.items.filter((item) => item.life >= 0);

        this.projectiles.forEach((projectile) => projectile.update(elapsedTime, this.players, this.platforms));
        this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);

        this.targetedProjectiles = this.targetedProjectiles.filter((targetedProjectile) => !targetedProjectile.isDead);
        this.targetedProjectiles.forEach((targetedProjectile) => targetedProjectile.update(elapsedTime, this.players, this.platforms, this.projectiles));
    }

    private interpretLeftClick(playerWithId: Player) {
        let targetItem: ClientItem | undefined;
        let targetItemDistanceFromCursor: number | undefined;
        
        this.items.forEach((item) => {
            const distanceFromCursor: number = Math.sqrt(Math.pow(item.position.x + item.itemSize / 2 - playerWithId.focusPosition.x, 2) + Math.pow(item.position.y + item.itemSize / 2 - playerWithId.focusPosition.y, 2));
            if ((!targetItem && distanceFromCursor < 20) || (targetItem && targetItemDistanceFromCursor && distanceFromCursor < targetItemDistanceFromCursor)) {
                targetItem = item;
                targetItemDistanceFromCursor = distanceFromCursor;
            }
        });

        if (targetItem && Math.sqrt(Math.pow(targetItem.position.x + targetItem.itemSize / 2 - playerWithId.position.x - playerWithId.size.width / 2, 2) + Math.pow(targetItem.position.y + targetItem.itemSize / 2 - playerWithId.position.y - playerWithId.size.height / 2, 2)) < 150) {
            if (targetItem.pickUp(playerWithId)){
                this.serverTalker.sendMessage({
                    type: "itemKillMessage",
                    id: targetItem.id,
                });
                this.serverTalker.sendMessage({
                    type: "playerUpdateStats",
                    id: playerWithId.id,
                    weaponEquipped: playerWithId.weaponEquipped,
                    abilityNames: playerWithId.abilityNames,
                });
                playerWithId.playerUpdateAbilityStats();
            }
        } else {
            playerWithId.playerAbilities[0].isCharging = true;
        }
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
        id: number,
        position: Vector,
        momentum: Vector,
        life: number,
    ) {
        const item = new ClientItem(this.config, {
            itemType,
            id,
            position,
            momentum,
            life,
        });
        this.items.push(item);
    }
}
