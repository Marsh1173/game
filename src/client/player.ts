import { SerializedPlayer } from "../serialized/player";
import { ServerTalker } from "./servertalker";
import { Player } from "../objects/player";
import { Vector } from "../vector";

export class ClientPlayer extends Player {
    constructor(info: SerializedPlayer, doBlast: (position: Vector, color: string, id: number) => void, private readonly serverTalker: ServerTalker) {
        super(
            info.id,
            info.position,
            info.momentum,
            info.color,
            info.size,
            info.blastCounter,
            info.alreadyJumped,
            info.canJump,
            info.standing,
            info.wasStanding,
            info.isDead,
            info.health,
            info.deathCooldown,
            info.lastHitBy,
            info.killCount,
            doBlast,
        );
    }

    public render(ctx: CanvasRenderingContext2D,
        xMousePos: number,
        yMousePos: number,
        isClicking: boolean,
        isCharging: number) {

            if (isClicking && !this.isDead) {

                let xComputed = (isCharging * xMousePos) + (this.position.x + this.size.width / 2) * (1 - isCharging) - 4;
                let yComputed = (isCharging * yMousePos) + (this.position.y + this.size.height / 2) * (1 - isCharging) - 4;

                ctx.beginPath();
                ctx.moveTo(this.position.x + (this.size.width / 2), this.position.y + (this.size.height / 2));// from player position
                ctx.lineTo(xComputed, yComputed); // pointing towards cursor, based on percentage of charge
                if (isCharging != 1) ctx.strokeStyle = "#555"; // charging is gray
                else ctx.strokeStyle = "#11d100"; // completed is green
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            ctx.fillStyle = this.color;
            const opacity = this.isDead ? 0.2 : 1.0;
            ctx.globalAlpha = opacity;
            ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
            ctx.globalAlpha = 1.0;
    }

    public jump() {
        super.jump();
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "jump",
            id: this.id,
        });
    }

    public moveLeft(elapsedTime: number) {
        super.moveLeft(elapsedTime);
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "moveLeft",
            id: this.id,
        });
    }

    public moveRight(elapsedTime: number) {
        super.moveLeft(elapsedTime);
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "moveRight",
            id: this.id,
        });
    }

    public blast(elapsedTime: number) {
        super.blast(elapsedTime);
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "blast",
            id: this.id,
        });
    }
}
