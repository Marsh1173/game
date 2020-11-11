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
    private frameIntervalId?: NodeJS.Timeout; // higher number means slower game
    private avgPlayerPos = 0;

    private constructGame(info: AllInfo, id: number) {
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

        this.constructGame(info, id);

        this.serverTalker.messageHandler = (msg: ServerMessage) => {
            if (msg.type === "info") {
                this.constructGame(msg.info, id);
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
        this.frameIntervalId = setInterval(() => {
            this.frame();
        }, 16);
    }

    public end() {
        Game.gameDiv.style.display = "none";
        Game.menuDiv.style.display = "block";
        if (this.frameIntervalId) {
            clearInterval(this.frameIntervalId);
        } else {
            throw new Error("Tried to stop a game that wasn't in progress?");
        }
        this.serverTalker.leave();
    }

    private frame() {
        // this.updateSlider();

        const playerWithId = this.players.find((player) => player.id === this.id);
        if (!playerWithId) {
            throw new Error("Player with my id does not exist in data from server");
        }
        if (this.keyState[config.playerKeys.up]) {
            playerWithId.attemptJump();
        }
        if (this.keyState[config.playerKeys.left]) {
            playerWithId.attemptMoveLeft();
        }
        if (this.keyState[config.playerKeys.right]) {
            playerWithId.attemptMoveRight();
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

        this.players.forEach((player) => player.update());

        this.blasts.forEach((blast) => blast.update());
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
