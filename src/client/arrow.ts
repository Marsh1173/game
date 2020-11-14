import { Config } from "../config";
import { Arrow } from "../objects/arrow";
import { SerializedArrow } from "../serialized/arrow";

export class ClientArrow extends Arrow {
    constructor(config: Config, info: SerializedArrow) {
        super(config, info.position, info.momentum, info.id, info.inGround);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(this.position.x - this.momentum.x / 70, this.position.y - this.momentum.y / 70); // from player position
        ctx.lineTo(this.position.x + this.momentum.x / 100, this.position.y + this.momentum.y / 100); // pointing towards cursor, based on percentage of charge
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 3;
    }
}
