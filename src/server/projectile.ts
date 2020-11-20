import { Config } from "../config";
import { Projectile } from "../objects/projectile";
import { SerializedProjectile } from "../serialized/projectile";

export class ServerProjectile extends Projectile {
    constructor(config: Config, info: SerializedProjectile) {
        super(config, info.position, info.momentum, info.id, info.inGround, info.isDead);
    }
}
