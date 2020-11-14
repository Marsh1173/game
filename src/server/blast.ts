import { Config } from "../config";
import { Blast } from "../objects/blast";
import { SerializedBlast } from "../serialized/blast";

export class ServerBlast extends Blast {
    constructor(config: Config, info: SerializedBlast) {
        super(config, info.position, info.color, info.id, info.size, info.opacity);
    }
}
