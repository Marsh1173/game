import { Arrow } from "../objects/arrow";
import { SerializedArrow } from "../serialized/arrow";

export class ClientArrow extends Arrow {
    constructor(info: SerializedArrow) {
        super(info.position, info.momentum, info.id, info.inGround);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.position.x - (this.momentum.x / 100),this.position.y - (this.momentum.y / 100));// from player position
        ctx.lineTo(this.position.x + (this.momentum.x / 100),this.position.y + (this.momentum.y / 100)); // pointing towards cursor, based on percentage of charge
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}
