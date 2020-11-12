import { config } from "../config";
import { SerializedBlast } from "../serialized/blast";
import { Vector } from "../vector";
import { Player } from "./player";

export abstract class Blast {
    constructor(public readonly position: Vector, public color: string, public id: number, public size: number, public opacity: number) {}

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
        this.size += (config.blastSize * elapsedTime) / config.blastDuration;
        this.opacity -= elapsedTime / config.blastDuration;
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
        if (distance < config.blastSize && this.id !== player.id) {
            const angle = Math.atan2(distanceVector.x, distanceVector.y);
            player.momentum.x -= (Math.sin(angle) * config.blastPower) / Math.pow(distance, 1.3);
            player.momentum.y -= (Math.cos(angle) * config.blastPower) / Math.pow(distance, 1.4) + (100 * config.blastSize / distance);
            if (!player.isDead) {
                player.damagePlayer(7);
                player.lastHitBy = this.id;
            }
        }
    }
}
