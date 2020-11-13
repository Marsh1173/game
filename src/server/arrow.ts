import { Arrow } from "../objects/arrow";
import { SerializedArrow } from "../serialized/arrow";

export class ServerArrow extends Arrow {
    constructor(info: SerializedArrow) {
        super(info.position, info.momentum, info.id, info.inGround);
    }
}
