import { Config } from "../config";
import { BasicAttack } from "../objects/basicAttack";
import { SerializedBasicAttack } from "../serialized/basicAttack";

export class ServerBasicAttack extends BasicAttack {
    constructor(config: Config, info: SerializedBasicAttack) {
        super(config, info.position, info.angle, info.id, info.damage, info.range, info.life, info.spread);
    }
}
