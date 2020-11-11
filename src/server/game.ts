import { AllInfo } from "../api/allinfo";
import { ServerBlast } from "./blast";
import { defaultPlatformList, ServerPlatform } from "./platform";
import { ServerPlayer } from "./player";
import * as wsWebsocket from "ws";
import { ClientMessage, InfoMessage, PlayerLeavingMessage } from "../api/message";
import { Vector } from "../vector";
import { config } from "../config";

export class Game {
    private intervalId?: NodeJS.Timeout;
    private static readonly REFRESH_RATE = 16;

    private players: ServerPlayer[] = [];
    private blasts: ServerBlast[] = [];
    private readonly platforms: ServerPlatform[] = defaultPlatformList;
    public readonly clientMap: Record<number, wsWebsocket> = {};

    constructor() {}

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
        Object.values(this.clientMap).forEach((client) => {
            client.send(JSON.stringify(data));
        });
    }

    public update(elapsedTime: number) {
        this.players.forEach((player) => player.update(elapsedTime));
        // Collision detection with other players or platforms
        this.players.forEach((player1) => {
            if (player1.isDead === false) {
                this.players.forEach((player2) => {
                    if (player1 !== player2 && player2.isDead === false) {
                        player1.checkCollisionWithRectantularObject(player2);
                    }
                });
                this.platforms.forEach((platform) => {
                    player1.checkCollisionWithRectantularObject(platform);
                });
            }
        });
        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);
        this.platforms.forEach((platform) => platform.update());
    }

    public newPlayer() {
        const newPlayer = new ServerPlayer((position: Vector, color: string) => {
            this.blast(position, color);
        });
        this.players.push(newPlayer);
        return newPlayer.id;
    }

    public removePlayer(id: number) {
        this.players = this.players.filter((player) => player.id !== id);
        const leavingMessage: PlayerLeavingMessage = {
            type: "playerLeaving",
            id,
        };
        Object.values(this.clientMap).forEach((ws) => {
            ws.send(JSON.stringify(leavingMessage));
        });
    }

    public handleMessage(id: number, data: ClientMessage) {
        switch (data.type) {
            case "action":
                if (data.actionType === "jump") {
                    this.players.find((player) => player.id === id)!.actionsNextFrame.jump = true;
                } else if (data.actionType === "moveLeft") {
                    this.players.find((player) => player.id === id)!.actionsNextFrame.moveLeft = true;
                } else if (data.actionType === "moveRight") {
                    this.players.find((player) => player.id === id)!.actionsNextFrame.moveRight = true;
                }
                break;
            default:
                throw new Error(`Invalid client message type: ${data.type}`);
                break;
        }
    }

    private blast(position: Vector, color: string) {
        const blast = new ServerBlast({
            position,
            color,
            size: config.blastSize,
            opacity: 1,
        });
        this.blasts.push(blast);
        this.players.forEach((player2) => {
            const distance = Math.sqrt(Math.pow(position.x - player2.position.x, 2) + Math.pow(position.y - player2.position.y, 2));
            if (distance < config.playerSize * 4 && distance != 0) {
                player2.momentum.x = ((player2.position.x - position.x) * Math.pow(config.playerSize, 1.9)) / Math.pow(distance, 2);
                player2.momentum.y =
                    ((player2.position.y - position.y) * Math.pow(config.playerSize, 1.9)) / Math.pow(distance, 2) - (config.playerSize * 4 - distance) / 13;
                //player2.health -= 5;
            }
        });
    }
}
