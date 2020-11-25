import { SerializedBlast } from "../serialized/blast";
import { SerializedPlatform } from "../serialized/platform";
import { SerializedPlayer } from "../serialized/player";
import { SerializedProjectile } from "../serialized/projectile";
import { SerializedTargetedProjectile } from "../serialized/targetedProjectile";

export interface AllInfo {
    players: SerializedPlayer[];
    blasts: SerializedBlast[];
    platforms: SerializedPlatform[];
    projectiles: SerializedProjectile[];
    targetedProjectiles: SerializedTargetedProjectile[];
}
