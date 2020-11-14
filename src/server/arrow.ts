import { Config } from "../config";
import { Arrow } from "../objects/arrow";
import { SerializedArrow } from "../serialized/arrow";

export class ServerArrow extends Arrow {
    constructor(config: Config, info: SerializedArrow) {
        super(config, info.position, info.momentum, info.id, info.inGround);
    }
}
