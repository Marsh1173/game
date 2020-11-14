import { SerializedPlayer } from "../serialized/player";
import { ServerTalker } from "./servertalker";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { Config } from "../config";

export class ClientPlayer extends Player {
    constructor(
        config: Config,
        info: SerializedPlayer,
        doBlast: (position: Vector, color: string, id: number) => void,
        doArrow: (position: Vector, mometum: Vector, id: number) => void,
        private readonly serverTalker: ServerTalker,
    ) {
        super(
            config,
            info.id,
            info.name,
            info.classType,
            info.weaponEquipped,
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
            info.mousePos,
            info.isCharging,
            info.isHit,
            info.isShielded,
            info.facing,
            doBlast,
            doArrow,
        );
    }

    public render(ctx: CanvasRenderingContext2D) {
        if (this.isShielded) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "white";
        } else if (this.health === 100) {
            ctx.shadowBlur = 3;
            ctx.shadowColor = "gray";
        } else if (!this.isDead) {
            ctx.shadowBlur = (100 - this.health) / 7;
            ctx.shadowColor = "red";
        }

        if (this.isHit === true) {
            ctx.fillStyle = "red";
        } else {
            if (this.isShielded) ctx.fillStyle = "white";
            else if (this.isDead) ctx.fillStyle = "black";
            else ctx.fillStyle = this.color;
        }

        //square
        const opacity = this.isDead ? 0.2 : 1.0;
        ctx.globalAlpha = opacity;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        if (this.isShielded || this.isDead) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x + 5, this.position.y + 5, this.size.width - 10, this.size.height - 10);
        }

        //headband
        ctx.shadowBlur = 0;
        ctx.fillStyle = "black";
        ctx.fillRect(this.position.x, this.position.y + 4, this.size.width, this.size.height - 40);

        //loose headband piece
        let xStart: number;
        if (this.facing) xStart = this.position.x;
        else xStart = this.position.x + this.size.width;

        ctx.beginPath();
        ctx.moveTo(xStart, this.position.y + 7);
        ctx.lineTo(xStart - this.momentum.x / 16, this.position.y + 20 - this.momentum.y / 30);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.globalAlpha = 1.0;

        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";

        //name
        ctx.fillStyle = "white";
        ctx.fillText(this.name, this.position.x, this.position.y - 10);
    }

    public renderMouseCharge(ctx: CanvasRenderingContext2D, xMousePos: number, yMousePos: number, isCharging: number) {
        let xComputed = isCharging * xMousePos + (this.position.x + this.size.width / 2) * (1 - isCharging) - 3;
        let yComputed = isCharging * yMousePos + (this.position.y + this.size.height / 2) * (1 - isCharging) - 3;

        ctx.shadowColor = "white";

        ctx.beginPath();
        ctx.moveTo(this.position.x + this.size.width / 2 - 3, this.position.y + this.size.height / 2 - 3); // from player position
        ctx.lineTo(xComputed, yComputed); // pointing towards cursor, based on percentage of charge
        if (isCharging < 1) ctx.strokeStyle = "#555";
        // charging is gray
        else ctx.strokeStyle = "#11d100"; // completed is green
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.shadowColor = "gray";
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
        super.moveRight(elapsedTime);
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

    public arrow() {
        super.arrow();
        this.serverTalker.sendMessage({
            type: "arrow",
            direction: { x: this.mousePos.x, y: this.mousePos.y },
            position: { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            id: this.id,
        });
    }
}
