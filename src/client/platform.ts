import { SerializedPlatform } from "../serialized/platform";
import { Platform } from "../objects/platform";
import { Config } from "../config";
import { Player } from "../objects/player";
import { sharing } from "webpack";

export class ClientPlatform extends Platform {
    constructor(config: Config, info: SerializedPlatform) {
        super(info.size, info.position, config);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.config.platformColor;
        ctx.shadowColor = this.config.platformColor;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }

    /*public renderSight(ctx: CanvasRenderingContext2D, player: Player) {
        ctx.shadowBlur = 1;
        ctx.shadowColor = "#202224";
        ctx.fillStyle = "#202224";

        for (let i: number = 0; i < 4; i++) {
            if (this.cornerPoints[i][1]) {
                ctx.beginPath();
                ctx.moveTo(this.cornerPoints[i][0].x, this.cornerPoints[i][0].y);

                ctx.lineTo(this.cornerPoints[i][0].x * 201 - (player.position.x + player.size.width / 2) * 200,
                    this.cornerPoints[i][0].y * 201 - (player.position.y + player.size.height / 2) * 200);
                ctx.lineTo(this.cornerPoints[(i + 1) % 4][0].x * 201 - (player.position.x + player.size.width / 2) * 200,
                    this.cornerPoints[(i + 1) % 4][0].y * 201 - (player.position.y + player.size.height / 2) * 200);

                ctx.lineTo(this.cornerPoints[(i + 1) % 4][0].x, this.cornerPoints[(i + 1) % 4][0].y);
                ctx.fill();
            }
        }
    }*/
}
