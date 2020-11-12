import { Blast } from "../objects/blast";
import { SerializedBlast } from "../serialized/blast";

export class ServerBlast extends Blast {
    constructor(info: SerializedBlast) {
        super(info.position, info.color, info.id, info.size, info.opacity);
    }
}
