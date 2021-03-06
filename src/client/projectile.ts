import { Config } from "../config";
import { Projectile } from "../objects/projectile";
import { SerializedProjectile } from "../serialized/projectile";
import { assetManager } from "./assetmanager";
import { ParticleSystem } from "./particle";

export class ClientProjectile extends Projectile {

    constructor(config: Config, info: SerializedProjectile) {

        super(config,          
            info.projectileType,
            info.damageType,
            info.damage,
            info.id,
            info.team,
            info.position,
            info.momentum,
            info.fallSpeed,
            info.knockback,
            info.range,
            info.life,
            info.inGround,);

    }

    public render(ctx: CanvasRenderingContext2D, particleHandler: ParticleSystem) {
        ctx.save();

        ctx.shadowBlur = 0;
        let rotation: number = Math.atan(this.momentum.y / this.momentum.x);

        var scale: number = 1;
        if (this.projectileType === "shuriken") {
            scale = 0.13;
        }
        else if (this.projectileType === "arrow"){
            scale = 0.17;
        }
        else if (this.projectileType === "ice") {
            if (!this.inGround){
                particleHandler.newEffect({
                    particleEffectType: "iceIdle",
                    position: { x: this.position.x - this.momentum.x / 100, y: this.position.y - this.momentum.y / 100},
                    momentum: this.momentum,
                    direction: { x: 0, y: 0 },
                    color: "white",
                });
            }

            ctx.shadowColor = "white";
            ctx.shadowBlur = 1;
            scale = 0.17;
        }
        else if (this.projectileType === "fire") {
            particleHandler.newEffect({
                particleEffectType: "fireballIdle",
                position: { x: this.position.x, y: this.position.y},
                momentum: this.momentum,
                direction: { x: 0, y: 0 },
                color: "orange",
            });

            ctx.shadowColor = "orange";
            ctx.shadowBlur = 4;
            scale = 0.25;
        }

        if (this.momentum.x < 0) rotation *= -1;
        if (this.momentum.x < 0) scale *= -1;

        ctx.transform(scale, 0, 0, Math.abs(scale), this.position.x, this.position.y);

        if (this.projectileType != 'shuriken') ctx.rotate(rotation + Math.PI / 4);
        else ctx.rotate(this.position.x / 150);

        if (this.projectileType === "ice") ctx.drawImage(assetManager.images["ice"], -assetManager.images["ice"].width / 2, -assetManager.images["ice"].height / 2);
        else if (this.projectileType === "fire") ctx.drawImage(assetManager.images["fire"], -assetManager.images["fire"].width / 2, -assetManager.images["fire"].height / 2);
        else if (this.projectileType === "shuriken") ctx.drawImage(assetManager.images["shuriken"], -assetManager.images["shuriken"].width / 2, -assetManager.images["shuriken"].height / 2);
        else if (this.projectileType === "arrow") ctx.drawImage(assetManager.images["arrow"], -assetManager.images["arrow"].width / 2, -assetManager.images["arrow"].height / 2);
        
        ctx.restore();
    }
}
