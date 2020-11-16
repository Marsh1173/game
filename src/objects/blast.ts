import { Config } from "../config";
import { SerializedBlast } from "../serialized/blast";
import { Vector } from "../vector";
import { Player } from "./player";
import { Arrow } from "./arrow";

export abstract class Blast {
    constructor(
        private readonly config: Config,
        public readonly position: Vector,
        public color: string,
        public id: number,
        public size: number,
        public opacity: number,
    ) {}

    public serialize(): SerializedBlast {
        return {
            position: this.position,
            color: this.color,
            id: this.id,
            size: this.size,
            opacity: this.opacity,
        };
    }

    public update(elapsedTime: number) {
        this.size += (this.config.blastRadius * elapsedTime) / this.config.blastDuration;
        this.opacity -= elapsedTime / this.config.blastDuration;
    }

    public blastPlayer(player: Player) {
        const x1 = this.position.x;
        const y1 = this.position.y;
        const x2 = player.position.x + player.size.width / 2;
        const y2 = player.position.y + player.size.height / 2;
        const distanceVector = {
            x: x1 - x2,
            y: y1 - y2,
        };
        const distance = Math.sqrt(Math.pow(distanceVector.x, 2) + Math.pow(distanceVector.y, 2));
        if (distance < this.config.blastRadius && this.id !== player.id) {
            const angle = Math.atan2(distanceVector.x, distanceVector.y);
            player.momentum.x -= (Math.sin(angle) * this.config.blastPower) / Math.pow(distance, 1.3);
            player.momentum.y -= (Math.cos(angle) * this.config.blastPower) / Math.pow(distance, 1.4) + (100 * this.config.blastRadius) / distance;
            if (!player.isDead && !player.isShielded) {
                player.damagePlayer(15, this.id);
            }
        }
    }
    public blastArrow(arrow: Arrow) {
        const x1 = this.position.x;
        const y1 = this.position.y;
        const x2 = arrow.position.x;
        const y2 = arrow.position.y;
        const distanceVector = {
            x: x1 - x2,
            y: y1 - y2,
        };
        const distance = Math.sqrt(Math.pow(distanceVector.x, 2) + Math.pow(distanceVector.y, 2));
        if (distance < this.config.blastRadius) {
            const angle = Math.atan2(distanceVector.x, distanceVector.y);
            arrow.momentum.x -= (Math.sin(angle) * this.config.blastPower) / (distance * 10);
            arrow.momentum.y -= (Math.cos(angle) * this.config.blastPower) / (distance * 10);
        }
    }
}
