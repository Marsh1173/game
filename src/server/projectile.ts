import { Config } from "../config";
import { Projectile, ProjectileType } from "../objects/projectile";
import { SerializedProjectile } from "../serialized/projectile";

export class ServerProjectile extends Projectile {
    constructor(config: Config, info: SerializedProjectile) {
        super(config, info.projectileType,
            info.damageType,
            info.damage,
            info.id,
            info.team,
            info.position,
            info.momentum,
            info.fallSpeed,
            info.knockback,
            info.range,
            info.life,
            info.inGround,);
    }
}
