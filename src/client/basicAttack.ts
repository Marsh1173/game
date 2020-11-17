import { Config } from "../config";
import { BasicAttack } from "../objects/basicAttack";
import { SerializedBasicAttack } from "../serialized/basicAttack";

export class ClientBasicAttack extends BasicAttack {
    constructor(config: Config, info: SerializedBasicAttack) {
        super(config, info.position, info.angle, info.id, info.damage, info.range, info.life, info.spread);
    }

    public render(ctx: CanvasRenderingContext2D) {

        ctx.globalAlpha = 1;
        ctx.fillStyle = "white";

        let rotation: number = this.angle;
        let newScale: number = 1;
        if (rotation > Math.PI / 2) {
            rotation = (Math.PI - rotation);
            newScale *= -1;
        }

        ctx.setTransform(newScale, 0, 0, 1, this.position.x, this.position.y);
        ctx.rotate(rotation);

        ctx.beginPath();
        ctx.moveTo(50, 0);
        ctx.lineTo(50, 60);
        ctx.lineTo(25, 10);
        ctx.fill();

        ctx.resetTransform();

        ctx.shadowBlur = 3;
        ctx.shadowColor = "gray";
        ctx.globalAlpha = 1.0;
    }
}
