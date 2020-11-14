import { Arrow } from "../objects/arrow";
import { SerializedArrow } from "../serialized/arrow";

export class ClientArrow extends Arrow {
    constructor(info: SerializedArrow) {
        super(info.position, info.momentum, info.id, info.inGround);
    }

    public render(ctx: CanvasRenderingContext2D) {

        ctx.shadowColor = "black";

        ctx.beginPath();
        ctx.moveTo(this.position.x - (this.momentum.x / 60),this.position.y - (this.momentum.y / 60));// from player position
        ctx.lineTo(this.position.x + (this.momentum.x / 60),this.position.y + (this.momentum.y / 60)); // pointing towards cursor, based on percentage of charge
        ctx.strokeStyle = "darkred";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.shadowColor = "gray";
    }
}
