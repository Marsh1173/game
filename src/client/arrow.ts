import { Config } from "../config";
import { Arrow } from "../objects/arrow";
import { SerializedArrow } from "../serialized/arrow";

export class ClientArrow extends Arrow {
    constructor(config: Config, info: SerializedArrow) {
        super(config, info.position, info.momentum, info.id, info.inGround, info.isDead);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.shadowBlur = 0;

        /*ctx.beginPath();
        ctx.moveTo(this.position.x - this.momentum.x / 70, this.position.y - this.momentum.y / 70); // from player position
        ctx.lineTo(this.position.x + this.momentum.x / 80, this.position.y + this.momentum.y / 80); // pointing towards cursor, based on percentage of charge
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 3;
        ctx.stroke();*/

        let rotation: number = Math.atan(this.momentum.y / this.momentum.x);
        let scale: number = 0.2;
        if (this.momentum.x < 0) rotation *= -1;
        if (this.momentum.x < 0) scale *= -1;
        let imgArrow = new Image();
        imgArrow.src = 'images/arrow.png';

        ctx.setTransform(scale, 0, 0, Math.abs(scale), this.position.x, this.position.y);
        ctx.rotate(rotation + Math.PI / 4);
        ctx.drawImage(imgArrow, -imgArrow.width / 2, -imgArrow.height / 2);
        ctx.resetTransform();

        ctx.shadowBlur = 2;
    }
}
