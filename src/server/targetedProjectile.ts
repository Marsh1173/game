import { Config } from "../config";
import { TargetedProjectile, TargetedProjectileType } from "../objects/targetedProjectile";
import { SerializedTargetedProjectile } from "../serialized/targetedProjectile";

export class ServerTargetedProjectile extends TargetedProjectile {
    constructor(config: Config, info: SerializedTargetedProjectile) {
        super(config,
            info.targetedProjectileType,
            info.id,
            info.team,
            info.position,
            info.momentum,
            info.destination,
            info.isDead,
            info.life);
    }
}
