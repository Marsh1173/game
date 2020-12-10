import { AllInfo } from "../api/allinfo";
import { ServerProjectile } from "./projectile";
import { ServerTargetedProjectile } from "./targetedProjectile";
import { getDefaultPlatformList, ServerPlatform } from "./platform";
import { ServerPlayer } from "./player";
import { ClientMessage, InfoMessage, PlayerLeavingMessage, ServerMessage } from "../api/message";
import { Vector } from "../vector";
import { Config } from "../config";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { PlayerAI } from "./playerai";
import { AiClassType, ClassType, isPlayerClassType, randomAiClassType } from "../classtype";
import { DamageType } from "../objects/player";
import { ServerItem } from "./item";
import { ItemType } from "../objects/item";
import { moveEmitHelpers } from "typescript";

export class Game {
    private intervalId?: NodeJS.Timeout;
    private static readonly REFRESH_RATE = 16;

    private players: ServerPlayer[] = [];
    private projectiles: ServerProjectile[] = [];
    private targetedProjectiles: ServerTargetedProjectile[] = [];
    private items: ServerItem[] = [];
    private readonly platforms: ServerPlatform[] = getDefaultPlatformList(this.config);
    public static readonly clientMap: Record<number, (message: ServerMessage) => void> = {};
    public static broadcastMessage(msg: ServerMessage) {
        Object.values(Game.clientMap).forEach((sendFunction) => {
            sendFunction(msg);
        });
    }

    private aiId: number;

    constructor(public readonly config: Config) {
        this.aiId = -2;
        this.makeNewAI();
    }

    public start() {
        this.intervalId = setInterval(() => {
            this.loop(Date.now());
        }, Game.REFRESH_RATE);
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        } else {
            throw new Error("Tried to stop a game that was not in progress");
        }
    }

    public allInfo(): AllInfo {
        return {
            players: this.players.map((player) => player.serialize()),
            projectiles: this.projectiles.map((projectile) => projectile.serialize()),
            targetedProjectiles: this.targetedProjectiles.map((targetedProjectile) => targetedProjectile.serialize()),
            platforms: this.platforms.map((platform) => platform.serialize()),
            items: this.items.map((item) => item.serialize()),
        };
    }

    private lastFrame?: number;
    public loop(timestamp: number) {
        if (!this.lastFrame) {
            this.lastFrame = timestamp;
        }
        const elapsedTime = (timestamp - this.lastFrame) / 1000;
        this.lastFrame = timestamp;
        this.update(elapsedTime * this.config.gameSpeed);
        /*const data: InfoMessage = {
            type: "info",
            info: this.allInfo(),
        };
        Game.broadcastMessage(data);*/
    }

    public update(elapsedTime: number) {
        this.updateObjects(elapsedTime);
        this.updateObjectsSecondary(elapsedTime);


        this.players.forEach((player) => {
            if (!isPlayerClassType(player.classType)){ // tells the players what the AIs are doing.
                Game.broadcastMessage({
                    type: "serverPlayerUpdate",
                    id: player.id,
                    focusPosition: player.focusPosition,
                    position: player.position,
                    health: player.health,
                });
            }
        });
    }

    private updateObjects(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime * player.effects.isSlowed, this.players, this.platforms, this.items, (!isPlayerClassType(player.classType))));

        this.projectiles.forEach((projectile) => projectile.update(elapsedTime, this.players, this.platforms));
        this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);

        this.items.forEach((item) => item.update(elapsedTime, this.platforms));
        this.items = this.items.filter((item) => item.life > 0);

        this.targetedProjectiles.forEach((targetedProjectile) => targetedProjectile.update(elapsedTime, this.players, this.platforms, this.projectiles));
        this.targetedProjectiles = this.targetedProjectiles.filter((targetedProjectile) => !targetedProjectile.isDead);

        this.platforms.forEach((platform) => platform.update());
    }

    private updateObjectsSecondary(elapsedTime: number) {

    }

    public newPlayer(id: number, name: string, color: string, classType: ClassType, position: Vector, team: number) {
        const newPlayer = new ServerPlayer(
            this.config,
            id,
            team,
            name,
            color,
            classType,
            position,
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
        );
        this.players.push(newPlayer);
        newPlayer.position.x = (newPlayer.team === 1) ? newPlayer.config.playerStart.x : newPlayer.config.playerStart.x + 3300;
        newPlayer.position.y = newPlayer.config.playerStart.y;

        /*const data: InfoMessage = {
            type: "info",
            info: this.allInfo(),
        };
        Game.broadcastMessage(data);*/

        Game.broadcastMessage({
            type: "playerInfo",
            id: newPlayer.id,
            info: newPlayer.serialize()
        });
    }

    public newPlayerAI(id: number, name: string, color: string, classType: AiClassType, position: Vector) {
        const newPlayerAI = new PlayerAI(
            this.config,
            id,
            -1,
            name,
            color,
            classType,
            position,
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
        );
        this.players.push(newPlayerAI);

        /*const data: InfoMessage = {
            type: "info",
            info: this.allInfo(),
        };
        Game.broadcastMessage(data);*/

        Game.broadcastMessage({
            type: "playerInfo",
            id: newPlayerAI.id,
            info: newPlayerAI.serialize()
        });
    }

    public removePlayer(id: number) {
        this.players = this.players.filter((player) => player.id !== id);
        const leavingMessage: PlayerLeavingMessage = {
            type: "playerLeaving",
            id,
        };
        Game.broadcastMessage(leavingMessage);
    }

    public handleMessage(id: number, data: ClientMessage) {
        switch (data.type) {
            case "action":
                switch (data.actionType) {
                    case "jump":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.jump = true;
                        Game.broadcastMessage({
                            type: "serverJump",
                            id: id,
                        });
                        break;
                    case "moveLeft":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.moveLeft = true;
                        Game.broadcastMessage({
                            type: "serverMoveLeft",
                            id: id,
                        });
                        break;
                    case "moveRight":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.moveRight = true;
                        Game.broadcastMessage({
                            type: "serverMoveRight",
                            id: id,
                        });
                        break;
                    case "basicAttack":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.basicAttack = true;
                        Game.broadcastMessage({
                            type: "serverBasicAttack",
                            id: id,
                        });
                        break;
                    case "secondaryAttack":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.secondaryAttack = true;
                        Game.broadcastMessage({
                            type: "serverSecondaryAttack",
                            id: id,
                        });
                        break;
                    case "firstAbility":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.firstAbility = true;
                        Game.broadcastMessage({
                            type: "serverFirstAbility",
                            id: id,
                        });
                        break;
                    case "secondAbility":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.secondAbility = true;
                        Game.broadcastMessage({
                            type: "serverSecondAbility",
                            id: id,
                        });
                        break;
                    case "thirdAbility":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.thirdAbility = true;
                        Game.broadcastMessage({
                            type: "serverThirdAbility",
                            id: id,
                        });
                        break;
                    case "die":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.die = true;
                        Game.broadcastMessage({
                            type: "serverDie",
                            id: id,
                        });
                        break;
                    default:
                        throw new Error(`Invalid client message actionType: ${data.actionType}`);
                }
                break;
            case "projectile":
                this.projectiles.push(
                    new ServerProjectile(this.config, {
                        projectileType: data.projectileType,
                        damageType: data.damageType,
                        damage: data.damage,
                        id: data.id,
                        team: data.team,
                        position: data.position,
                        momentum: data.momentum, // might be a pointer to old?
                        fallSpeed: data.fallSpeed,
                        knockback: data.knockback,
                        range: data.range,
                        life: data.life,
                        inGround: data.inGround,
                    }),
                );
                break;
            case "targetedProjectile":
                this.targetedProjectiles.push(
                    new ServerTargetedProjectile(this.config, {
                        targetedProjectileType: data.targetedProjectileType,
                        id: data.id,
                        team: data.team,
                        position: data.position,
                        momentum: data.momentum,
                        destination: data.destination,
                        isDead: data.isDead,
                        life: data.life,
                    }),
                );
                break;
            case "item":
                this.items.push(
                    new ServerItem(this.config, {
                        itemType: data.itemType,
                        position: data.position,
                        momentum: data.momentum,
                        life: data.life,
                    }),
                );
                break;
            case "playerUpdate":
                var player = this.players.find((player) => player.id === id);
                if (player) {
                    player.focusPosition = data.focusPosition;
                    player.position = data.position;
                } else console.log("could not find server player");
                Game.broadcastMessage({
                    type: "serverPlayerUpdate",
                    id: id,
                    focusPosition: data.focusPosition,
                    position: data.position,
                    health: data.health,
                });
                break;
            default:
                throw new Error(`Invalid client message type`);
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
        const projectile = new ServerProjectile(this.config, {
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
        const targetedProjectile = new ServerTargetedProjectile(this.config, {
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

    private item(
        itemType: ItemType,
        position: Vector,
        momentum: Vector,
        life: number,
    ) {
        const item = new ServerItem(this.config, {
            itemType,
            position,
            momentum,
            life,
        });
        this.items.push(item);
    }

    private makeNewAI() {
        if (this.players.length < 10){
            this.newPlayerAI(this.aiId, "AI", "#800d0d", randomAiClassType(), { x: this.config.xSize / 3 + Math.random() * 800, y: (this.config.ySize * 3) / 4 - 90 });
            this.aiId--;
        }
        setTimeout(() => {
            this.makeNewAI();
        }, 6000);
    }
}
