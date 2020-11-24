import { Config } from "../config";
import { Projectile } from "../objects/projectile";
import { SerializedProjectile } from "../serialized/projectile";

export class ClientProjectile extends Projectile {

    //private projectileImage = new Image();
    //projectileImage.src = info.image;

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

    public render(ctx: CanvasRenderingContext2D) {
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
            ctx.shadowColor = "white";
            ctx.shadowBlur = 1;
            scale = 0.17;
        }
        else if (this.projectileType === "fire") {
            ctx.shadowColor = "orange";
            ctx.shadowBlur = 4;
            scale = 0.25;
        }

        if (this.momentum.x < 0) rotation *= -1;
        if (this.momentum.x < 0) scale *= -1;

        var projectileImage = new Image();
        projectileImage.src = "images/projectiles/" + this.projectileType + ".png";

        ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x, this.position.y);

        if (this.projectileType != 'shuriken') ctx.rotate(rotation + Math.PI / 4);
        else ctx.rotate(this.position.x / 150);

        ctx.drawImage(projectileImage, -projectileImage.width / 2, -projectileImage.height / 2);
        ctx.resetTransform();

        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
    }
}
