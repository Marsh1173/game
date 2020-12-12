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
    public static itemId: number;

    constructor(public readonly config: Config) {
        Game.itemId = 0;
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
    }

    public update(elapsedTime: number) {
        this.updateObjects(elapsedTime);
        this.updateObjectsSecondary(elapsedTime);
    }

    private updateObjects(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime * player.effects.isSlowed, this.players, this.platforms, this.items, (!isPlayerClassType(player.classType))));

        this.projectiles.forEach((projectile) => projectile.update(elapsedTime, this.players, this.platforms));
        this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);

        this.items.forEach((item) => item.update(elapsedTime, this.platforms, this.items));
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
                id: number,
                position: Vector,
                momentum: Vector,
                life: number,
            ) => {
                this.item(itemType, id, position, momentum, life);
            },
        );
        this.players.push(newPlayer);
        newPlayer.position.x = (newPlayer.team === 1) ? newPlayer.config.playerStart.x : newPlayer.config.playerStart.x + 3300;
        newPlayer.position.y = newPlayer.config.playerStart.y;

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
                id: number,
                position: Vector,
                momentum: Vector,
                life: number,
            ) => {
                this.item(itemType, id, position, momentum, life);
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
        var player;
        switch (data.type) {
            case "clientPlayerActions" :
                Game.broadcastMessage({
                    type: "serverPlayerActions",
                    id: data.id,
                    moveRight: data.moveRight,
                    moveLeft: data.moveLeft,
                    jump: data.jump,
                    basicAttack: data.basicAttack,
                    secondaryAttack: data.secondaryAttack,
                    firstAbility: data.firstAbility,
                    secondAbility: data.secondAbility,
                    thirdAbility: data.thirdAbility,
                    die: data.die,
                    level: data.level,

                    focusPosition: data.focusPosition,
                    position: data.position,
                    health: data.health,
                });
                player = this.players.find((player) => player.id === id);
                if (player) {
                    player.actionsNextFrame.moveRight = data.moveRight;
                    player.actionsNextFrame.moveLeft = data.moveLeft;
                    player.actionsNextFrame.jump = data.jump;
                    player.actionsNextFrame.basicAttack = data.basicAttack;
                    player.actionsNextFrame.secondaryAttack = data.secondaryAttack;
                    player.actionsNextFrame.firstAbility = data.firstAbility;
                    player.actionsNextFrame.secondAbility = data.secondAbility;
                    player.actionsNextFrame.thirdAbility = data.thirdAbility;
                    player.actionsNextFrame.die = data.die;
                    player.actionsNextFrame.level = data.level;

                    player.focusPosition = data.focusPosition;
                    player.position = data.position;
                    player.health = data.health;
                }
                break;
            case "playerUpdateStats" :
                Game.broadcastMessage({
                    type: "serverPlayerUpdateStats",
                    id: data.id,
                    abilityNames: data.abilityNames,
                    weaponEquipped: data.weaponEquipped,
                });
                player = this.players.find((player) => player.id === id);
                if (player) {
                    player.abilityNames = data.abilityNames;
                    player.weaponEquipped = data.weaponEquipped;
                    player.playerUpdateAbilityStats();
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
            case "itemKillMessage":
                var item = this.items.find((item) => item.id === data.id);
                if (item) item.life = 0;
                Game.broadcastMessage({
                    type: "serverItemKillMessage",
                    id: data.id,
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
        id: number,
        position: Vector,
        momentum: Vector,
        life: number,
    ) {
        const item = new ServerItem(this.config, {
            itemType,
            id,
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
