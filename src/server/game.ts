import { AllInfo } from "../api/allinfo";
import { ServerBlast } from "./blast";
import { ServerProjectile } from "./projectile";
import { getDefaultPlatformList, ServerPlatform } from "./platform";
import { ServerPlayer } from "./player";
import * as wsWebsocket from "ws";
import { ClientMessage, InfoMessage, PlayerLeavingMessage, ServerMessage } from "../api/message";
import { Vector } from "../vector";
import { Config } from "../config";

export class Game {
    private intervalId?: NodeJS.Timeout;
    private static readonly REFRESH_RATE = 16;

    private players: ServerPlayer[] = [];
    private blasts: ServerBlast[] = [];
    private projectiles: ServerProjectile[] = [];
    private readonly platforms: ServerPlatform[] = getDefaultPlatformList(this.config);
    public readonly clientMap: Record<number, (message: ServerMessage) => void> = {};

    constructor(public readonly config: Config) {}

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
            blasts: this.blasts.map((blast) => blast.serialize()),
            projectiles: this.projectiles.map((projectile) => projectile.serialize()),
            platforms: this.platforms.map((platform) => platform.serialize()),
        };
    }

    private lastFrame?: number;
    public loop(timestamp: number) {
        if (!this.lastFrame) {
            this.lastFrame = timestamp;
        }
        const elapsedTime = (timestamp - this.lastFrame) / 1000;
        this.lastFrame = timestamp;
        this.update(elapsedTime);
        const data: InfoMessage = {
            type: "info",
            info: this.allInfo(),
        };
        Object.values(this.clientMap).forEach((sendFunction) => {
            sendFunction(data);
        });
    }



    public update(elapsedTime: number) {

        this.updateObjects(elapsedTime);
        this.updateObjectsSecondary(elapsedTime);



    }

    private updateObjects(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime, this.players));

        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);

        this.projectiles.forEach((projectile) => projectile.update(elapsedTime));
        this.projectiles = this.projectiles.filter((projectile) => projectile.isDead === false);

        this.platforms.forEach((platform) => platform.update());
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

    public newPlayer(id: number, name: string, color: string, classType: number) {
        const newPlayer = new ServerPlayer(
            this.config,
            id,
            name,
            color,
            classType,
            (position: Vector, color: string, id: number) => {
                this.blast(position, color, id);
            },
            (position: Vector, momentum: Vector, id: number) => {
                this.projectile(position, momentum, id);
            },
        );
        this.players.push(newPlayer);
    }

    public removePlayer(id: number) {
        this.players = this.players.filter((player) => player.id !== id);
        const leavingMessage: PlayerLeavingMessage = {
            type: "playerLeaving",
            id,
        };
        Object.values(this.clientMap).forEach((sendFunction) => {
            sendFunction(leavingMessage);
        });
    }

    public handleMessage(id: number, data: ClientMessage) {
        switch (data.type) {
            case "action":
                switch (data.actionType) {
                    case "jump":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.jump = true;
                        break;
                    case "moveLeft":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.moveLeft = true;
                        break;
                    case "moveRight":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.moveRight = true;
                        break;
                    case "blast":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.blast = true;
                        break;
                    case "basicAttack":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.basicAttack = true;
                        break;
                    case "secondaryAttack":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.secondaryAttack = true;
                        break;
                    default:
                        throw new Error(`Invalid client message actionType: ${data.actionType}`);
                }
                break;
            case "projectile":
                this.projectiles.push(
                    new ServerProjectile(this.config, {
                        position: data.position,
                        momentum: { x: data.direction.x, y: data.direction.y - 100 },
                        id,
                        inGround: false,
                        isDead: false,
                    }),
                );
                break;
            case "moveMouse":
                this.players.find((player) => player.id === id)!.focusPosition = data.position;
                break;
            case "animate":
                //var playerWithId: ServerPlayer = this.players.find((player) => player.id === id)!;
                //console.log(playerWithId.animationFrame + " " + playerWithId.id);
                this.players.find((player) => player.id === id)!.animationFrame = data.animationFrame;
                break;
            default:
                throw new Error(`Invalid client message type`);
        }
    }

    private blast(position: Vector, color: string, id: number) {
        const blast = new ServerBlast(this.config, {
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

    private projectile(position: Vector, momentum: Vector, id: number) {
        const projectile = new ServerProjectile(this.config, {
            position,
            momentum,
            id,
            inGround: false,
            isDead: false,
        });
        this.projectiles.push(projectile);
    }
}
