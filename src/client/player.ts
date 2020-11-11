import { SerializedPlayer } from "../serialized/player";
import { ServerTalker } from "./servertalker";
import { Player } from "../objects/player";
import { Vector } from "../vector";

export class ClientPlayer extends Player {
    constructor(info: SerializedPlayer, doBlast: (position: Vector, color: string) => void, private readonly serverTalker: ServerTalker) {
        super(
            info.id,
            info.position,
            info.momentum,
            info.color,
            info.size,
            info.blastCounter,
            info.alreadyJumped,
            info.canJump,
            info.standing,
            info.wasStanding,
            info.isDead,
            info.health,
            info.deathCooldown,
            doBlast,
        );
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        const opacity = this.isDead ? 0.2 : 1.0;
        ctx.globalAlpha = opacity;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.globalAlpha = 1.0;
    }

    public jump() {
        super.jump();
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "jump",
            id: this.id,
        });
    }

    public moveLeft() {
        super.moveLeft();
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "moveLeft",
            id: this.id,
        });
    }

    public moveRight() {
        super.moveLeft();
        this.serverTalker.sendMessage({
            type: "action",
            actionType: "moveRight",
            id: this.id,
        });
    }
}
