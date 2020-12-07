import { Config } from "../config";
import { Player } from "../objects/player";
import { TargetedProjectile } from "../objects/targetedProjectile";
import { SerializedTargetedProjectile } from "../serialized/targetedProjectile";
import { assetManager } from "./assetmanager";
import { ParticleSystem } from "./particle";

export class ClientTargetedProjectile extends TargetedProjectile {

    constructor(config: Config, info: SerializedTargetedProjectile) {

        super(config,          
            info.targetedProjectileType,
            info.id,
            info.team,
            info.position,
            info.momentum,
            info.destination,
            info.isDead,
            info.life);

    }

    public render(ctx: CanvasRenderingContext2D, particleHandler: ParticleSystem) {
        if (this.targetedProjectileType === "firestrike") this.renderFirestrike(ctx, particleHandler);
        else if (this.targetedProjectileType === "chains") this.renderChains(ctx);
        else if (this.targetedProjectileType === "healingAura") this.renderHealingAura(ctx);
        else if (this.targetedProjectileType === "blizzard") this.renderBlizzard(ctx, particleHandler);
    }

    public renderFirestrike(ctx: CanvasRenderingContext2D, particleHandler: ParticleSystem) {

        ctx.save();

        if (this.life != 0){
            particleHandler.newEffect({
                particleEffectType: "firestrikeIdle",
                position: { x: this.position.x, y: this.position.y - 50},
                momentum: this.momentum,
                direction: { x: 0, y: 0 },
                color: "orange",
            });
        } else {
            particleHandler.newEffect({
                particleEffectType: "firestrikeExplode",
                position: { x: this.position.x, y: this.position.y},
                momentum: this.momentum,
                direction: { x: 0, y: 0 },
                color: "orange",
            });
        }

        ctx.shadowBlur = 0;

        let rotation: number = Math.atan(this.momentum.y / this.momentum.x);
        var scale: number = 0.5;
        ctx.shadowColor = "red";
        ctx.shadowBlur = 50;

        if (this.momentum.x < 0) rotation *= -1;
        if (this.momentum.x < 0) scale *= -1;

        ctx.transform(scale, 0, 0, Math.abs(scale), this.position.x, this.position.y);

        ctx.rotate(rotation + Math.PI / 4);

        ctx.drawImage(assetManager.images["firestrike"], -assetManager.images["firestrike"].width / 2, -assetManager.images["firestrike"].height / 2);

        /*ctx.globalAlpha = 0.1;
        ctx.fillStyle = "orange";
        ctx.beginPath(); // pillar
        ctx.moveTo(this.destination.x - 60, this.destination.y - this.config.ySize - 50);
        ctx.lineTo(this.destination.x + 60, this.destination.y - this.config.ySize - 50);
        ctx.lineTo(this.destination.x + 65, this.destination.y);
        ctx.lineTo(this.destination.x - 65, this.destination.y);
        ctx.fill();*/
        ctx.restore();
    }

    public renderChains(ctx: CanvasRenderingContext2D) {

        //let rotation: number = Math.atan(this.momentum.y / this.momentum.x);
        ctx.shadowColor = "white";
        ctx.shadowBlur = 50;

        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "cyan";

        ctx.beginPath(); // circle
        ctx.arc(this.position.x, this.position.y, 45, 0, 2 * Math.PI);
        ctx.fill();


        ctx.globalAlpha = 1.0;
        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
    }

    public renderHealingAura(ctx: CanvasRenderingContext2D) {

        //let rotation: number = Math.atan(this.momentum.y / this.momentum.x);
        ctx.shadowColor = "white";
        ctx.shadowBlur = 50;

        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "yellow";

        ctx.beginPath(); // circle
        ctx.arc(this.position.x, this.position.y, 150, 0, 2 * Math.PI);
        ctx.fill();


        ctx.globalAlpha = 1.0;
        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
    }

    public renderGravity(ctx: CanvasRenderingContext2D) {

        //let rotation: number = Math.atan(this.momentum.y / this.momentum.x);
        ctx.shadowColor = "white";
        ctx.shadowBlur = 50;

        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "white";

        ctx.beginPath(); // circle
        ctx.arc(this.position.x, this.position.y, 30, 0, 2 * Math.PI);
        ctx.fill();


        ctx.globalAlpha = 1.0;
        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
    }

    public renderBlizzard(ctx: CanvasRenderingContext2D, particleHandler: ParticleSystem) {

        particleHandler.newEffect({
            particleEffectType: "blizzardIdle",
            position: { x: this.position.x, y: this.position.y},
            momentum: this.momentum,
            direction: { x: 0, y: 0 },
            color: "blue",
        });
        
        
        ctx.save();

        ctx.globalAlpha = 0.01;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "white";
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.position.x - 170, this.position.y - 125, 340, 200);

        ctx.restore();
    }
}
