import { AllInfo } from "../api/allinfo";
import { ServerBlast } from "./blast";
import { ServerArrow } from "./arrow";
import { defaultPlatformList, ServerPlatform } from "./platform";
import { ServerPlayer } from "./player";
import * as wsWebsocket from "ws";
import { ClientMessage, InfoMessage, PlayerLeavingMessage } from "../api/message";
import { Vector } from "../vector";

export class Game {
    private intervalId?: NodeJS.Timeout;
    private static readonly REFRESH_RATE = 16;

    private players: ServerPlayer[] = [];
    private blasts: ServerBlast[] = [];
    private arrows: ServerArrow[] = [];
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
            arrows: this.arrows.map((arrow) => arrow.serialize()),
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
        this.players.forEach((player1) => {
            this.players.forEach((player2) => {
                if (player1 !== player2 && player2.isDead === false && player1.isDead === false) {
                    player1.checkCollisionWithRectangularObject(player2, elapsedTime);
                }
            });
            this.platforms.forEach((platform) => {
                player1.checkCollisionWithRectangularObject(platform, elapsedTime);
            });
        });

        this.arrows.forEach((arrow) => {
            this.players.forEach((player) => {
                arrow.checkCollisionWithPlayer(player, elapsedTime);
                
            });
            this.platforms.forEach((platform) => {
                arrow.checkCollisionWithRectangularObject(platform, elapsedTime);
            });
        });

        this.players.forEach((player) => player.update(elapsedTime));
        // Collision detection with other players or platforms
        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);

        this.arrows.forEach((arrow) => arrow.update(elapsedTime));
        this.arrows = this.arrows.filter((arrow) => arrow.inGround === false);

        this.platforms.forEach((platform) => platform.update());
    }

    public newPlayer() {
        const newPlayer = new ServerPlayer((position: Vector, color: string, id: number) => {
            this.blast(position, color, id);
        },(position: Vector, momentum: Vector, id: number) => {
            this.arrow(position, momentum, id);
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
                    case "arrow":
                        this.players.find((player) => player.id === id)!.actionsNextFrame.arrow = true;
                        break;
                    default:
                        throw new Error(`Invalid client message actionType: ${data.actionType}`);
                }
                break;
            default:
                throw new Error(`Invalid client message type: ${data.type}`);
        }
    }

    private blast(position: Vector, color: string, id: number) {
        const blast = new ServerBlast({
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
    }

    private arrow(position: Vector, momentum: Vector, id: number) {
        const arrow = new ServerArrow({
            position,
            momentum,
            id,
            inGround: false,
        });
        this.arrows.push(arrow);
    }
}
