import { SerializedPlayer } from "../serialized/player";
import { ServerTalker } from "./servertalker";
import { DamageType, Player } from "../objects/player";
import { Vector } from "../vector";
import { Config } from "../config";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { Platform } from "../objects/platform";
import { assetManager } from "./assetmanager";
import { Size } from "../size";
import { playerRenderData } from "./playerRenderData";
import { WeaponRender } from "./clientWeapon";
import { Item, ItemType } from "../objects/item";
import { getWeaponIcon } from "../weapon";
import { getAbilityIcon } from "../objects/abilities";
import { ids } from "webpack";

export class ClientPlayer extends Player {
    constructor(
        config: Config,
        info: SerializedPlayer,
        doProjectile: (
            projectileType: ProjectileType,
            damageType: DamageType,
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
        public doItem: (
            itemType: ItemType,
            id: number,
            position: Vector,
            momentum: Vector,
            life: number,
        ) => void,
        private readonly serverTalker: ServerTalker,
        private readonly isClientPlayer: number,
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
            info.effects,
            info.abilityNames,
            info.facing,
            info.moveSpeedModifier,
            info.healthModifier,
            info.level,
            doProjectile,
            doTargetedProjectile,
            doItem,
        );
    }

    public render(ctx: CanvasRenderingContext2D) {
        if (this.effects.isStealthed) {
            ctx.shadowBlur = 10;
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 2;
            ctx.shadowColor = "gray";
            return;
        } else if (this.effects.isShielded) {
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

        if (this.effects.isShielded) ctx.fillStyle = "white";
        else if (this.isDead) ctx.fillStyle = "black";
        else ctx.fillStyle = this.isHit ? "red" : this.color;

        //square
        const opacity = this.isDead ? 0.1 : 0.9;
        ctx.globalAlpha = opacity;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        if (this.effects.isShielded || this.isDead) {
            // for exceptions, colors the inside normally
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x + 5, this.position.y + 5, this.size.width - 10, this.size.height - 10);
        }

        //reset

        playerRenderData[this.classType](ctx, this);

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    }

    public renderFirstAbilityPointer(ctx: CanvasRenderingContext2D, platforms: Platform[]) {
        if (this.classType === "wizard") this.renderFirestrikePointer(ctx, platforms);
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

    public renderLimitedVision(ctx: CanvasRenderingContext2D, range: number) {
        ctx.save();
        ctx.shadowBlur = 100;
        ctx.globalAlpha = 0.6;

        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath(); // circle
        ctx.arc(
            this.position.x + this.size.width / 2 - this.momentum.x / 50,
            this.position.y + this.size.height / 2 - this.momentum.y / 50,
            range,
            0,
            2 * Math.PI,
        );
        ctx.fill();

        ctx.restore();
    }

    public renderHealth(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "red";
        ctx.fillRect(this.position.x + this.size.width / 8, this.position.y - 10, (this.size.width * 3) / 4, 5);
        if (this.isHit) {
            ctx.shadowBlur = 5;
            ctx.fillStyle = "white";
            ctx.shadowColor = "white";
            ctx.fillRect(
                this.position.x + this.size.width / 8,
                this.position.y - 10,
                (Math.max((this.size.width * this.health) / (100 + this.healthModifier), 0) * 3) / 4 + 2,
                5,
            );
        }
        ctx.fillStyle = "#32a852";
        ctx.fillRect(this.position.x + this.size.width / 8, this.position.y - 10, (Math.max((this.size.width * this.health) / (100 + this.healthModifier), 0) * 3) / 4, 5);

        ctx.restore();
    }

    public renderName(ctx: CanvasRenderingContext2D, color: string) {
        ctx.save();
        ctx.shadowBlur = 0;

        ctx.fillStyle = color;
        ctx.fillText(
            "(" + this.level + ") " + this.name,
            this.position.x + this.size.width / 2 - ("(" + this.level + ") " + this.name).length * 2.4,
            this.position.y - 11,
        );
        ctx.restore();
    }

    public renderFocus(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.focusPosition.x - 3, this.focusPosition.y - 3, 6, 6);
    }

    public renderWeapon(ctx: CanvasRenderingContext2D) {
        WeaponRender[this.weaponEquipped](this, ctx);
    }

    public renderUI(ctx: CanvasRenderingContext2D, screenPos: Vector) {

        this.renderHealthAndLevel(ctx, screenPos);
        this.renderAbilities(ctx, screenPos);
        for (let i = 0; i < this.abilityNames.length; i++) {
            if (this.playerAbilities[i].chargeAmount > 0) {
                this.renderCharger(ctx, screenPos, Math.min(1, this.playerAbilities[i].chargeAmount / this.playerAbilities[i].abilityType.chargeReq));
                break;
            }
        }
        //if
    }

    public renderHealthAndLevel(ctx: CanvasRenderingContext2D, screenPos: Vector) {
        ctx.save();
        if (this.config.ySize < (window.innerHeight)) ctx.translate(-screenPos.x + window.innerWidth - 370, -screenPos.y + this.config.ySize - 40);
        else ctx.translate(-screenPos.x + window.innerWidth - 390, -screenPos.y + window.innerHeight - 40);
        ctx.globalAlpha = 0.6;
        ctx.font = "30px Arial";

        if (this.isDead || this.effects.isStealthed) {
            ctx.globalAlpha = 0.2;
            ctx.shadowColor = "darkgray";
            ctx.shadowBlur = 20;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(340, 0, 30, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(340, 0, 31, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.arc(340, 0, 29, -Math.PI / 2, 2 * Math.PI * (this.XP / this.XPuntilNextLevel) - Math.PI / 2);
        ctx.stroke();

        ctx.strokeStyle = "darkgray"
        ctx.strokeRect(0, -20, 300, 40);
        if (this.effects.isShielded) ctx.fillStyle = "cyan";
        else if (this.isDead) ctx.fillStyle = "cyan";
        else if (this.isHit) {
            ctx.fillStyle = "white";
            ctx.fillRect(300 * (this.health / (100 + this.healthModifier)), -20, 15, 40);
            ctx.fillStyle = "green";
        }
        else ctx.fillStyle = "green";
        ctx.fillRect(0, -20, 300 * (this.health / (100 + this.healthModifier)), 40);

        ctx.shadowColor = "black";
        ctx.shadowBlur = 5;
        ctx.fillStyle = "white";
        ctx.fillText(this.level.toString(), -ctx.measureText(this.level.toString()).width / 2 + 340, 10);
        ctx.fillText(Math.floor(this.health).toString() + " / " + Math.floor(100 + this.healthModifier).toString(), 50, 10);


        ctx.restore();
    }

    public renderAbilities(ctx: CanvasRenderingContext2D, screenPos: Vector) {

        ctx.save();
        if (this.config.ySize < (window.innerHeight)) ctx.translate(-screenPos.x + (window.innerWidth / 2) - 300, -screenPos.y + this.config.ySize - 80);
        else ctx.translate(-screenPos.x + (window.innerWidth / 2) - 300, -screenPos.y + window.innerHeight - 80);
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 3;
        ctx.fillStyle = "black";
        for(let i = 0; i < this.abilityNames.length; i++) {
            ctx.translate(80 + ((i === 2) ? 50 : 0), 0)

            if (this.playerAbilities[i].abilityName === "none") {
                ctx.fillRect(2, 2, 71, 71);
            } else {
                if (this.playerAbilities[i].abilityName === "basicAttack") {
                    ctx.drawImage(assetManager.images[getWeaponIcon(this.weaponEquipped)], 2, 2, 71, 71);
                } else {
                    ctx.drawImage(assetManager.images[getAbilityIcon(this.playerAbilities[i].abilityName)], 2, 2, 71, 71);
                }
                ctx.strokeStyle = (this.playerAbilities[i].isCharging) ? "white" : "darkgray";
                ctx.lineWidth = (this.playerAbilities[i].isCharging) ? 5 : 3;
                ctx.strokeRect(0, 0, 75, 75);
                
                if (this.playerAbilities[i].cooldown > 0) {
                    const height: number = this.playerAbilities[i].cooldown / this.playerAbilities[i].abilityType.cooldownReq;
                    ctx.fillRect(2, 73 - 71 * height, 71, 71 * height);

                    ctx.strokeStyle = "white";
                    ctx.beginPath();
                    ctx.moveTo(2, 73 - 71 * height);
                    ctx.lineTo(73, 73 - 71 * height);
                    ctx.stroke();
                    ctx.strokeStyle = "darkgray";
                }
            }
        }
        ctx.restore();
    }

    public renderCharger(ctx: CanvasRenderingContext2D, screenPos: Vector, decimal: number) {
        ctx.save();
        if (this.config.ySize < (window.innerHeight)) ctx.translate(-screenPos.x + (window.innerWidth / 2) - 197, -screenPos.y + this.config.ySize - 115);
        else ctx.translate(-screenPos.x + (window.innerWidth / 2) - 197, -screenPos.y + window.innerHeight - 115);
        ctx.globalAlpha = 0.6;

        ctx.fillStyle = "black"
        ctx.fillRect(-1, -1, 402, 22);
        ctx.fillStyle = (decimal < 1) ? "rgb(10, 100, 0)" : "rgb(20, 200, 0)";
        ctx.fillRect(0, 0, 400 * decimal, 20);

        ctx.restore();
    }

    protected broadcastActions() {

        this.serverTalker.sendMessage({
            type: "clientPlayerActions",
            id: this.id,
            moveRight: this.actionsNextFrame.moveRight,
            moveLeft: this.actionsNextFrame.moveLeft,
            jump: this.actionsNextFrame.jump,
            basicAttack: this.actionsNextFrame.basicAttack,
            secondaryAttack: this.actionsNextFrame.secondaryAttack,
            firstAbility: this.actionsNextFrame.firstAbility,
            secondAbility: this.actionsNextFrame.secondAbility,
            thirdAbility: this.actionsNextFrame.thirdAbility,
            die: this.actionsNextFrame.die,
            level: this.actionsNextFrame.level,
    
            focusPosition: this.focusPosition,
            position: this.position,
            health: this.health,
        });
        
        super.broadcastActions();
    }
}
