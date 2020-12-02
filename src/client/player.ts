import { SerializedPlayer } from "../serialized/player";
import { ServerTalker } from "./servertalker";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { Config } from "../config";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { Platform } from "../objects/platform";
import { assetManager } from "./assetmanager";
import { Size } from "../size";

export class ClientPlayer extends Player {
    constructor(
        config: Config,
        info: SerializedPlayer,
        doProjectile: (
            projectileType: ProjectileType,
            damageType: string,
            damage: number,
            id: number,
            team: number,
            position: Vector,
            momentum: Vector,
            fallSpeed: number,
            knockback: number,
            range: number,
            life: number,
            inGround: boolean,
        ) => void,
        doTargetedProjectile: (
            targetedProjectileType: TargetedProjectileType,
            id: number,
            team: number,
            position: Vector,
            momentum: Vector,
            destination: Vector,
            isDead: boolean,
            life: number,
        ) => void,
        private readonly serverTalker: ServerTalker,
        private readonly isClientPlayer: number,
        private prevFocusPosition: Vector = { x: info.focusPosition.x, y: info.focusPosition.y },
    ) {
        super(
            config,
            info.id,
            info.team,
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
            info.isStealthed,
            info.facing,
            info.moveSpeedModifier,
            info.healthModifier,
            info.level,
            doProjectile,
            doTargetedProjectile,
        );
    }

    public update(elapsedTime: number, players: Player[], platforms: Platform[]) {
        if (this.prevFocusPosition.x !== this.focusPosition.x || this.prevFocusPosition.y !== this.focusPosition.y) {
            this.serverTalker.sendMessage({
                type: "moveMouse",
                id: this.id,
                position: this.focusPosition,
            });
            this.prevFocusPosition.x = this.focusPosition.x;
            this.prevFocusPosition.y = this.focusPosition.y;
        }

        super.update(elapsedTime, players, platforms);
    }

    public render(ctx: CanvasRenderingContext2D) {
        if (this.isStealthed) {
            ctx.shadowBlur = 10;
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 2;
            ctx.shadowColor = "gray";
            return;
        } else if (this.isShielded) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "white";
        } else if (this.health >= 100 + this.healthModifier) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = this.color;
        } else if (!this.isDead) {
            ctx.shadowBlur = 7;
            ctx.shadowColor = this.color; //red?
        }

        //hit and shielded exceptions

        if (this.isShielded) ctx.fillStyle = "white";
        else if (this.isDead) ctx.fillStyle = "black";
        else ctx.fillStyle = this.isHit ? "red" : this.color;

        //square
        const opacity = this.isDead ? 0.1 : 0.9;
        ctx.globalAlpha = opacity;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        if (this.isShielded || this.isDead) {
            // for exceptions, colors the inside normally
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x + 5, this.position.y + 5, this.size.width - 10, this.size.height - 10);
        }

        //reset

        //renders the gear
        if (this.classType === 0) {
            this.renderNinja(ctx);
        } else if (this.classType === 1) {
            this.renderWizard(ctx);
        } else if (this.classType === 2) {
            this.renderTemplar(ctx);
        }

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderFirstAbilityPointer(ctx: CanvasRenderingContext2D, platforms: Platform[]) {
        if (this.classType === 1) this.renderFirestrikePointer(ctx, platforms);
    }

    public renderFirestrikePointer(ctx: CanvasRenderingContext2D, platforms: Platform[]) {
        let x = this.focusPosition.x - 4;
        let y = this.config.ySize;

        platforms.forEach((platform) => {
            if (platform.position.x < x && platform.position.x + platform.size.width > x && platform.position.y > this.focusPosition.y - 4) {
                y = platform.position.y;
            }
        });

        ctx.shadowBlur = 7;
        ctx.shadowColor = "orange";

        ctx.fillStyle = "orange"; // side spikes
        ctx.beginPath();
        ctx.moveTo(x + 80, y - 50);
        ctx.lineTo(x + 70, y);
        ctx.lineTo(x + 65, y);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 80, y - 50);
        ctx.lineTo(x - 70, y);
        ctx.lineTo(x - 65, y);
        ctx.fill();

        ctx.beginPath(); // base
        ctx.moveTo(x - 25, y - 5);
        ctx.lineTo(x + 25, y - 5);
        ctx.lineTo(x + 70, y);
        ctx.lineTo(x - 70, y);
        ctx.fill();

        ctx.globalAlpha = 0.1;
        ctx.beginPath(); // pillar
        ctx.moveTo(x - 60, y - this.config.ySize - 50);
        ctx.lineTo(x + 60, y - this.config.ySize - 50);
        ctx.lineTo(x + 65, y);
        ctx.lineTo(x - 65, y);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.beginPath(); // orange pointer on mouse
        ctx.moveTo(this.focusPosition.x - 3, this.focusPosition.y);
        ctx.lineTo(this.focusPosition.x - 13, this.focusPosition.y - 40);
        ctx.lineTo(this.focusPosition.x + 7, this.focusPosition.y - 40);
        ctx.fill();

        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderInvisibleScreen(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "black";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 100;
        ctx.globalAlpha = 0.6;

        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath(); // circle
        ctx.arc(
            this.position.x + this.size.width / 2 - this.momentum.x / 50,
            this.position.y + this.size.height / 2 - this.momentum.y / 50,
            500,
            0,
            2 * Math.PI,
        );
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderDeadScreen(ctx: CanvasRenderingContext2D) {
        ctx.shadowColor = "red";
        ctx.shadowBlur = 100;

        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath(); // circle
        ctx.arc(
            this.position.x + this.size.width / 2 - this.momentum.x / 50,
            this.position.y + this.size.height / 2 - this.momentum.y / 50,
            this.deathCooldown * 3,
            0,
            2 * Math.PI,
        );
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderHealth(ctx: CanvasRenderingContext2D) {
        ctx.shadowBlur = 0;

        ctx.fillStyle = "red";
        ctx.fillRect(this.position.x + this.size.width / 8, this.position.y - 10, (this.size.width * 3) / 4, 4);
        if (this.isHit) {
            ctx.shadowBlur = 2;
            ctx.fillStyle = "white";
            ctx.shadowColor = "white";
            ctx.fillRect(
                this.position.x + this.size.width / 8,
                this.position.y - 10,
                (((this.size.width * this.health) / (100 + this.healthModifier)) * 3) / 4 + 2,
                4,
            );
        }
        ctx.fillStyle = "#32a852";
        ctx.fillRect(this.position.x + this.size.width / 8, this.position.y - 10, (((this.size.width * this.health) / (100 + this.healthModifier)) * 3) / 4, 4);

        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
    }

    public renderName(ctx: CanvasRenderingContext2D, color: string) {
        ctx.shadowBlur = 0;

        ctx.fillStyle = color;
        ctx.fillText(
            "(" + this.level + ") " + this.name,
            this.position.x + this.size.width / 2 - ("(" + this.level + ") " + this.name).length * 2.4,
            this.position.y - 11,
        );

        //ctx.fillStyle = "white";
        //ctx.fillText(this.killCount.toString(), this.position.x + this.size.width / 2 - this.name.length * 2.4, this.position.y - 15);
    }

    public renderFocus(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.focusPosition.x - 6, this.focusPosition.y - 6, 6, 6);
    }

    public renderNinja(ctx: CanvasRenderingContext2D) {
        //headband
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
        ctx.lineTo(xStart - this.momentum.x / 60 + 2, this.position.y + 20 - this.momentum.y / 100);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xStart, this.position.y + 7);
        ctx.lineTo(xStart - this.momentum.x / 70 - 2, this.position.y + 30 - this.momentum.y / 100);
        ctx.stroke();

        //reset
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderWizard(ctx: CanvasRenderingContext2D) {
        ctx.shadowBlur = 0;

        const imagePosition: Vector = {
            x: this.position.x + this.size.width * 0.15,
            y: this.position.y - this.size.height * 1.0,
        };
        const imageSize: Size = {
            width: this.size.width * 1.1,
            height: this.size.height * 1.1,
        };
        const rotation = 0.3;
        ctx.save();
        ctx.translate(imagePosition.x, imagePosition.y);
        ctx.rotate(rotation);
        ctx.translate(-imagePosition.x, -imagePosition.y);
        ctx.drawImage(assetManager.images["wizard-hat"], imagePosition.x, imagePosition.y, imageSize.width, imageSize.height);
        ctx.restore();

        //reset
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderTemplar(ctx: CanvasRenderingContext2D) {
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
        ctx.lineTo(xStart - this.momentum.x / 60, this.position.y + this.size.height / 2 + 10 - this.momentum.y / 80);
        ctx.stroke();

        //reset
        ctx.shadowBlur = 2;
    }

    public renderWeapon(ctx: CanvasRenderingContext2D) {
        if (this.classType === 0) {
            this.renderWeaponTemplate(ctx, assetManager.images["sword"], 0.17);
        } else if (this.classType === 1) {
            this.renderWeaponTemplate(ctx, assetManager.images["staff"], 0.24);
        } else if (this.classType === 2) {
            this.renderWeaponTemplate(ctx, assetManager.images["hammer"], 0.25);
        } else if (this.classType === -1) {
            this.renderWeaponTemplate(ctx, assetManager.images["axe"], 0.2);
        }
        else if (this.classType === -2) {
            this.renderWeaponTemplate(ctx, assetManager.images["bow"], 0.2);
        }
    }

    public renderWeaponTemplate(ctx: CanvasRenderingContext2D, img: HTMLImageElement, scale: number) {
        ctx.save()

        ctx.shadowBlur = 0;
        let rotation: number = Math.atan(
            (this.focusPosition.y - this.position.y - this.size.height / 2) / (this.focusPosition.x - this.position.x - this.size.width / 2),
        );

        if (this.focusPosition.x - this.position.x - this.size.width / 2 < 0) {
            scale *= -1;
            rotation *= -1;
            ctx.transform(
                scale,
                0,
                0,
                Math.abs(scale),
                this.position.x + this.size.width / 2 - 40 * Math.cos(rotation),
                this.position.y + this.size.height / 2 + 40 * Math.sin(rotation),
            );
        } else {
            ctx.transform(
                scale,
                0,
                0,
                Math.abs(scale),
                this.position.x + this.size.width / 2 + 40 * Math.cos(rotation),
                this.position.y + this.size.height / 2 + 40 * Math.sin(rotation),
            );
        }

        ctx.rotate(rotation + Math.PI / 4 + this.animationFrame);
        ctx.drawImage(img, (-img.width * 2) / 3, (-img.height * 3) / 4 - this.animationFrame * 60);

        ctx.restore();
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

    public basicAttack(players: Player[]) {
        /*Game.particleHandler.newEffect({
            particleType: "smoke",
            position: { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            particleSize: { width: 150, height: 150 },
            particleSpeed: { mean: 100, stdev: 60 },
            particleLifetime: { mean: 0.4, stdev: 0.3 },
            particleAmt: 70,
        });*/
        super.basicAttack(players);
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

    public firstAbility(players: Player[], platforms: Platform[]) {
        super.firstAbility(players, platforms);
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "firstAbility",
            id: this.id,
        });
    }
}
