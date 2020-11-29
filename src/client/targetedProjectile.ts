import { Config } from "../config";
import { Player } from "../objects/player";
import { TargetedProjectile } from "../objects/targetedProjectile";
import { SerializedTargetedProjectile } from "../serialized/targetedProjectile";
import { ParticleSystem } from "./particle";

export class ClientTargetedProjectile extends TargetedProjectile {

    public targetedProjectileImage= new Image();

    //private projectileImage = new Image();
    //projectileImage.src = info.image;

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

        if (this.targetedProjectileType === "firestrike") this.targetedProjectileImage.src = "images/targetedProjectiles/" + this.targetedProjectileType + ".png";

    }

    public render(ctx: CanvasRenderingContext2D, particleHandler: ParticleSystem) {
        if (this.targetedProjectileType === "firestrike") this.renderFirestrike(ctx, particleHandler);
        if (this.targetedProjectileType === "chains") this.renderChains(ctx);
    }

    public renderFirestrike(ctx: CanvasRenderingContext2D, particleHandler: ParticleSystem) {

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

        ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x, this.position.y);

        ctx.rotate(rotation + Math.PI / 4);

        ctx.drawImage(this.targetedProjectileImage, -this.targetedProjectileImage.width / 2, -this.targetedProjectileImage.height / 2);
        ctx.resetTransform();


        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "orange";
        ctx.beginPath(); // pillar
        ctx.moveTo(this.destination.x - 60, this.destination.y - this.config.ySize - 50);
        ctx.lineTo(this.destination.x + 60, this.destination.y - this.config.ySize - 50);
        ctx.lineTo(this.destination.x + 65, this.destination.y);
        ctx.lineTo(this.destination.x - 65, this.destination.y);
        ctx.fill();
        ctx.globalAlpha = 1.0;


        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
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

    /*public firestrikeExplode(players: Player[]) {

        particleHandler.newEffect({
            particleEffectType: "firestrikeIdle",
            position: { x: this.position.x, y: this.position.y - 50},
            momentum: this.momentum,
            direction: { x: 0, y: 0 },
            color: "orange",
        });

        super.firestrikeExplode(players);
    }*/
}
