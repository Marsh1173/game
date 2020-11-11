import { time } from "console";
import { AllInfo } from "../api/allinfo";
import { ServerMessage } from "../api/message";
import { config } from "../config";
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
    private players: ClientPlayer[] = [];
    private blasts: ClientBlast[] = [];
    private platforms: ClientPlatform[] = [];
    private going: boolean = false;

    private constructGame(info: AllInfo) {
        this.platforms = info.platforms.map((platformInfo) => new ClientPlatform(platformInfo));
        this.blasts = info.blasts.map((blastInfo) => new ClientBlast(blastInfo));
        this.players = info.players.map(
            (playerInfo) =>
                new ClientPlayer(
                    playerInfo,
                    (position: Vector, color: string) => {
                        this.blast(position, color);
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
        // this.updateSlider();

        const playerWithId = this.players.find((player) => player.id === this.id);
        if (!playerWithId) {
            throw new Error("Player with my id does not exist in data from server");
        }
        if (this.keyState[config.playerKeys.up]) {
            playerWithId.attemptJump();
        }
        if (this.keyState[config.playerKeys.left]) {
            playerWithId.attemptMoveLeft(elapsedTime);
        }
        if (this.keyState[config.playerKeys.right]) {
            playerWithId.attemptMoveRight(elapsedTime);
        }
        if (this.keyState[config.playerKeys.down]) {
            playerWithId.attemptBlast();
        }

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

        this.players.forEach((player) => player.update(elapsedTime));

        this.blasts.forEach((blast) => blast.update(elapsedTime));
        this.blasts = this.blasts.filter((blast) => blast.opacity > 0);

        this.render();
    }

    private render() {
        Game.ctx.clearRect(0, 0, config.xSize, config.ySize);
        this.players.forEach((player) => player.render(Game.ctx));
        this.platforms.forEach((platform) => platform.render(Game.ctx));
        this.blasts.forEach((blast) => blast.render(Game.ctx));
    }

    /**
     * TODO: Make this work with the new canvas stuff
     */
    private updateSlider() {
        let playersArray = this.players.filter((player) => !player.isDead);
        let avgPlayerPos = playersArray.reduce((result, elem) => (result -= elem.position.x), 0) / playersArray.length;
        if (window.innerWidth - 35 > config.xSize) {
            avgPlayerPos = 0;
        }
        // go off the slider screen if the window is bigger
        else {
            // else go off the window
            avgPlayerPos += window.innerWidth / 2 - 35;
            if (avgPlayerPos > 0) avgPlayerPos = 0;
            else if (avgPlayerPos * -1 > config.xSize - window.innerWidth + 20) {
                avgPlayerPos = (config.xSize - window.innerWidth + 20) * -1;
            }
        }
    }

    private blast(position: Vector, color: string) {
        const blast = new ClientBlast({
            position,
            color,
            opacity: 1,
            size: 0,
        });
        this.blasts.push(blast);
        this.players.forEach((player) => {
            blast.blastPlayer(player);
        });
    }
}
