import { Blast } from "./blast";
import { Platform } from "./platform";
import { Player } from "./player";

export class Game {
    private intervalId?: NodeJS.Timeout;
    private static readonly REFRESH_RATE = 16;

    private readonly players: Player[] = [];
    private readonly blasts: Blast[] = [];
    private readonly platforms: Platform[] = [];

    constructor() {}

    public start() {
        this.intervalId = setInterval(() => {
            this.frame();
        }, Game.REFRESH_RATE);
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        } else {
            throw new Error("Tried to stop a game that was not in progress");
        }
    }

    public allInfo() {
        return {
            players: this.players.map((player) => player.serialize()),
            blasts: this.blasts.map((blast) => blast.serialize()),
            platforms: this.platforms.map((platform) => platform.serialize()),
        };
    }

    public frame() {
        this.players.forEach((player) => player.update());
        this.blasts.forEach((blast) => blast.update());
        this.platforms.forEach((platform) => platform.update());
    }
}
