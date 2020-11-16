import { SerializedPlayer } from "../serialized/player";
import { ServerTalker } from "./servertalker";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { Config } from "../config";
import { createVoidZero } from "typescript";
import { safeGetElementById } from "./util";

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

        if(this.classType === 1) this.renderWizardWeapon(ctx);

        if (this.isShielded) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "white";
        } else if (this.health >= 100) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
        } else if (!this.isDead) {
            ctx.shadowBlur = this.health / 5;
            ctx.shadowColor = this.color;//red?
        }


        //hit and shielded exceptions
        if (this.isHit === true) {
            ctx.fillStyle = "red";
        } else {
            if (this.isShielded) ctx.fillStyle = "white";
            else if (this.isDead) ctx.fillStyle = "black";
            else ctx.fillStyle = this.color;
        }

        //square
        const opacity = this.isDead ? 0.2 : 0.9;
        ctx.globalAlpha = opacity;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        if (this.isShielded || this.isDead) { // for exceptions, colors the inside normally
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x + 5, this.position.y + 5, this.size.width - 10, this.size.height - 10);
        }

        //reset
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";

        if(this.classType === 0) this.renderNinja(ctx);
        else if(this.classType === 1) {
            this.renderWizard(ctx);
            //this.renderWizardWeapon(ctx, x, y);
        }
        //else if(this.classType === 2) this.renderTemplar(ctx);

        //name
        ctx.fillStyle = "white";
        ctx.fillText(this.name, this.position.x + (this.size.width / 2) - (this.name.length * 2.2) - 1, this.position.y - 15);
    }

    public renderMouseCharge(ctx: CanvasRenderingContext2D, xMousePos: number, yMousePos: number, isCharging: number) {
        let xComputed = isCharging * xMousePos + (this.position.x + this.size.width / 2) * (1 - isCharging) - 3;
        let yComputed = isCharging * yMousePos + (this.position.y + this.size.height / 2) * (1 - isCharging) - 3;

        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(this.position.x + this.size.width / 2 - 3, this.position.y + this.size.height / 2 - 3); // from player position
        ctx.lineTo(xComputed, yComputed); // pointing towards cursor, based on percentage of charge
        if (isCharging < 1) ctx.strokeStyle = "#555";
        // charging is gray
        else ctx.strokeStyle = "#11d100"; // completed is green
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderNinja(ctx: CanvasRenderingContext2D) {
        //headband
        const opacity = this.isDead ? 0.2 : 0.9;
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 0;
        ctx.fillStyle = "black";
        ctx.fillRect(this.position.x, this.position.y + 4, this.size.width, this.size.height - 40);

        //loose headband piece
        let xStart: number;
        if (this.facing) xStart = this.position.x + 2;
        else xStart = this.position.x + this.size.width - 2;

        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(xStart, this.position.y + 7);
        ctx.lineTo(xStart - this.momentum.x / 16 + 2, this.position.y + 20 - this.momentum.y / 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xStart, this.position.y + 7);
        ctx.lineTo(xStart - this.momentum.x / 20 - 2, this.position.y + 30 - this.momentum.y / 30);
        ctx.stroke();


        //reset
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderWizard(ctx: CanvasRenderingContext2D) {
        const opacity = this.isDead ? 0.2 : 0.9;
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 0;
        
        //hat triangle
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.position.x + this.size.width, this.position.y);
        ctx.lineTo(this.position.x + (this.size.width / 2), this.position.y - 50);
        ctx.fillStyle = "purple";
        ctx.fill();

        //beard
        ctx.beginPath();
        if (!this.facing){
            ctx.moveTo(this.position.x + 3, this.position.y + this.size.height * 2 / 5);
            ctx.lineTo(this.position.x + this.size.width / 5, this.position.y + (this.size.height * 5 / 6));
            ctx.lineTo(this.position.x + (this.size.width / 2), this.position.y + (this.size.height * 2 / 5) + 3);
        } else {
            ctx.moveTo(this.position.x + this.size.width - 3, this.position.y + this.size.height * 2 / 5);
            ctx.lineTo(this.position.x + this.size.width * 4 / 5, this.position.y + (this.size.height * 5 / 6));
            ctx.lineTo(this.position.x + (this.size.width / 2), this.position.y + (this.size.height * 2 / 5) + 3);
        }
        ctx.fillStyle = "lightgray";
        ctx.fill();

        //mustache
        ctx.beginPath();
        if (!this.facing){
            ctx.moveTo(this.position.x + 3, this.position.y + this.size.height * 2 / 5);
            ctx.lineTo(this.position.x + this.size.width / 4, this.position.y + (this.size.height / 3));
            ctx.lineTo(this.position.x + (this.size.width / 2), this.position.y + (this.size.height * 2 / 5) + 3);
        } else {
            ctx.moveTo(this.position.x + this.size.width - 3, this.position.y + this.size.height * 2 / 5);
            ctx.lineTo(this.position.x + this.size.width * 3 / 4, this.position.y + (this.size.height / 3));
            ctx.lineTo(this.position.x + (this.size.width / 2), this.position.y + (this.size.height * 2 / 5) + 3);
        }
        ctx.strokeStyle = "lightgray";
        ctx.lineWidth = 2;
        ctx.stroke();



        //hat band
        ctx.beginPath();
        if (!this.facing){
            ctx.moveTo(this.position.x - 10, this.position.y - 3);
            ctx.lineTo(this.position.x + this.size.width + 10, this.position.y);
        } else {
            ctx.moveTo(this.position.x - 10, this.position.y);
            ctx.lineTo(this.position.x + this.size.width + 10, this.position.y - 3);
        }
        ctx.strokeStyle = "purple";
        ctx.lineWidth = 7;
        ctx.stroke();


        //reset
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderWizardWeapon(ctx: CanvasRenderingContext2D) {
        ctx.shadowBlur = 0;

        let scale: number = 0.17;
        if (this.facing) scale *= -1;
        var imgStaff = new Image();
        imgStaff.src = 'images/staff.png';

        if (this.facing) ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x + this.size.width + 15, this.position.y + 20);
        else ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x - 15, this.position.y + 20);
        ctx.rotate(Math.PI / 8);
        ctx.drawImage(imgStaff, -imgStaff.width / 2, -imgStaff.height / 2);
        ctx.resetTransform();

        ctx.shadowBlur = 2;
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

    /*public moveMouse() {
        super.moveMouse();
        this.serverTalker.sendMessage({
            type: "moveMouse",
            position: { x: this.mousePos.x, y: this.mousePos.y },
            id: this.id,
        });
    }*/
}
