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
        private readonly isClientPlayer: number,
        private prevFocusPosition: Vector = { x: info.focusPosition.x, y: info.focusPosition.y },
    ) {
        super(
            config,
            info.id,
            info.name,
            info.classType,
            info.weaponEquipped,
            info.animationFrame,
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
            info.focusPosition,
            info.isCharging,
            info.isHit,
            info.isShielded,
            info.facing,
            doBlast,
            doArrow,
        );
    }

    public update(elapsedTime: number, players: Player[]) {
        if (this.prevFocusPosition.x !== this.focusPosition.x || this.prevFocusPosition.y !== this.focusPosition.y) {
            this.serverTalker.sendMessage({
                type: "moveMouse",
                id: this.id,
                position: this.focusPosition,
            });
            this.prevFocusPosition.x = this.focusPosition.x;
            this.prevFocusPosition.y = this.focusPosition.y;
        }

        if (this.id === this.isClientPlayer) {
            this.serverTalker.sendMessage({
                type: "animate",
                id: this.id,
                animationFrame: this.animationFrame,
            });
        }
        super.update(elapsedTime, players);
    }

    public render(ctx: CanvasRenderingContext2D) {

        if (this.isShielded) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "white";
        } else if (this.health >= 100) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = this.color;
        } else if (!this.isDead) {
            ctx.shadowBlur = this.health / 6;
            ctx.shadowColor = this.color; //red?
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
        if (this.isShielded || this.isDead) {
            // for exceptions, colors the inside normally
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x + 5, this.position.y + 5, this.size.width - 10, this.size.height - 10);
        }

        //reset
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";


        //renders the gear
        if (this.classType === 0) {
            this.renderNinja(ctx);
        } else if (this.classType === 1) {
            this.renderWizard(ctx);
        } else if (this.classType === 2) {
            this.renderTemplar(ctx);
        };

        //name
        ctx.fillStyle = "white";
        ctx.fillText(this.name, this.position.x + this.size.width / 2 - this.name.length * 2.2 - 1, this.position.y - 15);
    }

    public renderMouseCharge(ctx: CanvasRenderingContext2D, isCharging: number) {
        let xComputed = isCharging * this.focusPosition.x + (this.position.x + this.size.width / 2) * (1 - isCharging) - 3;
        let yComputed = isCharging * this.focusPosition.y + (this.position.y + this.size.height / 2) * (1 - isCharging) - 3;

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
        let xStart: number = this.position.x + this.size.width - 2;
        if (this.facing) xStart = this.position.x + 2;

        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(xStart, this.position.y + 7);
        ctx.lineTo(xStart - this.momentum.x / 25 + 2, this.position.y + 20 - this.momentum.y / 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xStart, this.position.y + 7);
        ctx.lineTo(xStart - this.momentum.x / 27 - 2, this.position.y + 30 - this.momentum.y / 40);
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

        //beard
        ctx.beginPath();
        ctx.fillStyle = "lightgray";
        if (!this.facing) {
            ctx.moveTo(this.position.x + 3, this.position.y + (this.size.height * 2) / 5);
            ctx.lineTo(this.position.x + this.size.width / 5, this.position.y + (this.size.height * 5) / 6);
            ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + (this.size.height * 2) / 5 + 3);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.position.x + this.size.width, this.position.y);
            ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height / 3);
            ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + this.size.height / 6);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.position.x + 3, this.position.y + (this.size.height * 2) / 5);
            ctx.lineTo(this.position.x + this.size.width / 4, this.position.y + this.size.height / 3);
            ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + (this.size.height * 2) / 5 + 3);
        } else {
            ctx.moveTo(this.position.x + this.size.width - 3, this.position.y + (this.size.height * 2) / 5);
            ctx.lineTo(this.position.x + (this.size.width * 4) / 5, this.position.y + (this.size.height * 5) / 6);
            ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + (this.size.height * 2) / 5 + 3);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.position.x, this.position.y + this.size.height / 3);
            ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + this.size.height / 6);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.position.x + this.size.width - 3, this.position.y + (this.size.height * 2) / 5);
            ctx.lineTo(this.position.x + (this.size.width * 3) / 4, this.position.y + this.size.height / 3);
            ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + (this.size.height * 2) / 5 + 3);
        }
        ctx.strokeStyle = "lightgray";
        ctx.lineWidth = 2;
        ctx.stroke();


        //reset
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderTemplar(ctx: CanvasRenderingContext2D) {
        const opacity = this.isDead ? 0.2 : 0.9;
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 0;

        //scarf
        ctx.fillStyle = "mediumblue";
        ctx.fillRect(this.position.x, this.position.y + this.size.height / 2, this.size.width, -10);

        //loose scarf piece
        let xStart: number = this.position.x + this.size.width - 3;
        if (this.facing) xStart = this.position.x + 3;

        ctx.strokeStyle = "mediumblue";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(xStart, this.position.y + this.size.height / 2 - 6);
        ctx.lineTo(xStart - this.momentum.x / 20, this.position.y + this.size.height / 2 + 10 - this.momentum.y / 40);
        ctx.stroke();


        //reset
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
    }

    public renderWeapon(ctx: CanvasRenderingContext2D) {
        if (this.classType === 0) {
            this.renderWeaponTemplate(ctx, "images/sword.png", 0.20);
        } else if (this.classType === 1) {
            this.renderWeaponTemplate(ctx, "images/staff.png", 0.21);
        } else if (this.classType === 2) {
            this.renderWeaponTemplate(ctx, "images/hammer.png", 0.25);
        };
    }

    public renderWeaponTemplate(ctx: CanvasRenderingContext2D, imgSrc: string, scale: number) {
        ctx.shadowBlur = 0;

        let rotation: number = Math.atan((this.focusPosition.y - this.position.y - this.size.height / 2)
         / (this.focusPosition.x - this.position.x - this.size.width / 2));

        var imgDagger = new Image();
        imgDagger.src = imgSrc;

        if ((this.focusPosition.x - this.position.x - this.size.width / 2) < 0) {
            scale *= -1;
            rotation *= -1;
            ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x + this.size.width / 2 - 40 * Math.cos(rotation), this.position.y  + this.size.height / 2  + 40 * Math.sin(rotation));
        } else {
            ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x + this.size.width / 2 + 40 * Math.cos(rotation), this.position.y  + this.size.height / 2  + 40 * Math.sin(rotation));
        }
        
        ctx.rotate(rotation + Math.PI / 8 + this.animationFrame);
        ctx.drawImage(imgDagger, -imgDagger.width * 2 / 3, -imgDagger.height * 3 / 4 - (this.animationFrame * 60));
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

    public projectile() {
        super.projectile();
        this.serverTalker.sendMessage({
            type: "projectile",
            direction: { x: this.focusPosition.x, y: this.focusPosition.y },
            position: { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            id: this.id,
        });
    }

    public basicAttack(player: Player) {
        super.basicAttack(player);
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "basicAttack",
            id: this.id,
        });
    }

    public secondaryAttack(players: Player[]) {
        super.secondaryAttack(players);
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "secondaryAttack",
            id: this.id,
        });
    }

}
