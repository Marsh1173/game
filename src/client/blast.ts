import { Config } from "../config";
import { Blast } from "../objects/blast";
import { SerializedBlast } from "../serialized/blast";

export class ClientBlast extends Blast {
    constructor(config: Config, info: SerializedBlast) {
        super(config, info.position, info.color, info.id, info.size, info.opacity);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}
