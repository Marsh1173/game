import { Config } from "../config";
import { Blast } from "../objects/blast";
import { SerializedBlast } from "../serialized/blast";

export class ClientBlast extends Blast {
    constructor(config: Config, info: SerializedBlast) {
        super(config, info.position, info.color, info.id, info.size, info.opacity);
    }

    public render(ctx: CanvasRenderingContext2D) {

        ctx.shadowBlur = 50;
        ctx.shadowColor = this.color;

        ctx.globalAlpha = this.opacity / 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowBlur = 3;
        ctx.shadowColor = "gray";
        ctx.globalAlpha = 1.0;
    }
}
