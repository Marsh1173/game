import { SerializedPlatform } from "../serialized/platform";
import { Platform } from "../objects/platform";
import { config } from "../config";

export class ClientPlatform extends Platform {
    constructor(info: SerializedPlatform) {
        super(info.size, info.position);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = config.platformColor;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }
}
