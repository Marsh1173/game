import { config } from "../config";
import { SerializedBlast } from "../serialized/blast";
import { Vector } from "../vector";

export abstract class Blast {
    constructor(public readonly position: Vector, public color: string, public size: number, public opacity: number) {}

    public serialize(): SerializedBlast {
        return {
            position: this.position,
            color: this.color,
            size: this.size,
            opacity: this.opacity,
        };
    }

    public update() {
        this.position.x -= config.blastSize / 4;
        this.position.y -= config.blastSize / 4;
        this.size += config.blastSize / 2;
        this.opacity -= 0.05;
    }
}
