import { time } from "console";
import { AllInfo } from "../api/allinfo";
import { ServerMessage } from "../api/message";
import { config } from "../config";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { ClientBlast } from "./blast";
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
    private screenPos: number = 0;
    private players: ClientPlayer[] = [];
    private blasts: ClientBlast[] = [];
    private platforms: ClientPlatform[] = [];
    private going: boolean = false;

    private mousePos: Vector = {x: 56, y: 0};
    private isClicking: boolean = false;
    private isCharging: number = 0;


    private constructGame(info: AllInfo) {
        this.platforms = info.platforms.map((platformInfo) => new ClientPlatform(platformInfo));
        this.blasts = info.blasts.map((blastInfo) => new ClientBlast(blastInfo));
        this.players = info.players.map(
            (playerInfo) =>
                new ClientPlayer(
                    playerInfo,
                    (position: Vector, color: string, id: number) => {
                        this.blast(position, color, id);
                    },
                    this.serverTalker,
                ),
        );
    }

    constructor(info: AllInfo, private readonly id: number, private readonly serverTalker: ServerTalker) {
        Game.canvas.style.width = config.xSize + "px";
        Game.canvas.style.height = config.ySize + "px";
        Game.canvas.width = config.xSize;
        Game.canvas.height = config.ySize;

        this.constructGame(info);

        this.serverTalker.messageHandler = (msg: ServerMessage) => {
            if (msg.type === "info") {
                this.constructGame(msg.info);
            }
        };

        // use onkeydown and onkeyup instead of addEventListener because it's possible to add multiple event listeners per event
        // This would cause a bug where each time you press a key it creates multiple blasts or jumps
        safeGetElementById("slider").onmousedown = (e: MouseEvent) => {
            this.isClicking = true;
        };
        window.onmouseup = (e: MouseEvent) => {
            this.isClicking = false;
            this.isCharging = 0;
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

        safeGetElementById("slideContainer").style.height = config.ySize + 'px';
        safeGetElementById("slider").style.width = config.xSize + 'px';
        safeGetElementById('slider').style.left = this.screenPos + "px";

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
        this.updateSlider();

        const playerWithId = this.players.find((player) => player.id === this.id);
        if (!playerWithId) {
            throw new Error("Player with my id does not exist in data from server");
        }
        if (this.keyState[config.playerKeys.up]) {
            playerWithId.attemptJump();
            this.keyState[config.playerKeys.up] = false;
        }
        if (this.keyState[config.playerKeys.left]) {
            playerWithId.attemptMoveLeft(elapsedTime);
        }
        if (this.keyState[config.playerKeys.right]) {
            playerWithId.attemptMoveRight(elapsedTime);
        }
        if (this.keyState[config.playerKeys.down]) {
            playerWithId.attemptBlast(elapsedTime);
            this.keyState[config.playerKeys.down] = false;
        }


        //update if player is charging, can be cleaned up
        if (this.isClicking && this.isCharging < 1) this.isCharging += elapsedTime * 2;
        else if (this.isCharging > 1) this.isCharging = 1;

        //update health bar
        safeGetElementById("health").style.width = (playerWithId.health * 1.02) + '%';

        // Collision detection with other players or platforms
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

        this.players.forEach((player) => player.update(elapsedTime));

        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);

        this.render();
    }

    private render() {
        Game.ctx.clearRect(0, 0, config.xSize, config.ySize);
        this.players.forEach((player) => player.render(Game.ctx, this.mousePos.x - this.screenPos, this.mousePos.y, this.isClicking, (this.isCharging * 0.8 + 0.2)));
        this.platforms.forEach((platform) => platform.render(Game.ctx));
        this.blasts.forEach((blast) => blast.render(Game.ctx));
    }

    private updateSlider() {

        const playerWithId = this.players.find((player) => player.id === this.id);
        if (!playerWithId) {
            throw new Error("Player with my id does not exist in data from server");
        }

        //check if screen is bigger than field
        if (config.xSize < window.innerWidth - 20) {
            this.screenPos = 0;
        } else {

            let temp = this.screenPos + (-playerWithId.position.x + (window.innerWidth / 2) - this.screenPos) / 10;
            //make a temp position to check where it would be updated to
            if (this.screenPos < temp + 1 && this.screenPos > temp - 1) {
                return; //so it's not updating even while idle
            }

            if (temp > 0) { // if they're too close to the left wall
                if (this.screenPos === 0) return;
                this.screenPos = 0;
            }else if (temp < -(config.xSize - window.innerWidth + 6)) { // or the right wall
                if (this.screenPos === -(config.xSize - window.innerWidth + 6)) return;
                this.screenPos = -(config.xSize - window.innerWidth + 6);
            } else {
                if (this.screenPos > temp + 1 || this.screenPos < temp - 1) {
                    this.screenPos = temp; // otherwise the predicted position is fine
                }
            }
        }

        safeGetElementById('slider').style.left = this.screenPos + "px";
    }

    private blast(position: Vector, color: string, id: number) {
        const blast = new ClientBlast({
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
}
