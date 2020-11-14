import { Config } from "../config";
import { SerializedPlatform } from "../serialized/platform";
import { Size } from "../size";
import { Vector } from "../vector";

export abstract class Platform {
    constructor(public readonly size: Size, public readonly position: Vector, public readonly config: Config) {}

    public serialize(): SerializedPlatform {
        return {
            position: this.position,
            size: this.size,
        };
    }
}
