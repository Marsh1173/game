import { Config } from "../config";
import { SerializedPlatform } from "../serialized/platform";
import { Size } from "../size";
import { Vector } from "../vector";

export abstract class Platform {

    public readonly cornerPoints: Vector[];

    constructor(public readonly size: Size, public readonly position: Vector, public readonly config: Config) {
        this.cornerPoints = [
            {x: this.position.x , y: this.position.y},
            {x: this.position.x + this.size.width, y: this.position.y},
            {x: this.position.x + this.size.width, y: this.position.y + this.size.height},
            {x: this.position.x, y: this.position.y + this.size.height}];

    }

    public serialize(): SerializedPlatform {
        return {
            position: this.position,
            size: this.size,
        };
    }
}
