import { Config } from "../config";
import { Projectile } from "../objects/projectile";
import { SerializedProjectile } from "../serialized/projectile";

export class ClientProjectile extends Projectile {
    constructor(config: Config, info: SerializedProjectile) {
        super(config, info.projectileType,
            info.damageType,
            info.damage,
            info.id,
            info.team,
            info.image,
            info.position,
            info.momentum,
            info.angle,
            info.fallSpeed,
            info.knockback,
            info.range,
            info.life,
            info.inGround,);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.shadowColor = "white";
        ctx.shadowBlur = 6;

        let rotation: number = Math.atan(this.momentum.y / this.momentum.x);
        let scale: number = 0.17;
        if (this.momentum.x < 0) rotation *= -1;
        if (this.momentum.x < 0) scale *= -1;
        let imgArrow = new Image();
        imgArrow.src = 'images/projectiles/ice.png';

        ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x, this.position.y);
        ctx.rotate(rotation + Math.PI / 4);
        ctx.drawImage(imgArrow, -imgArrow.width / 2, -imgArrow.height / 2);
        ctx.resetTransform();

        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
    }
}
