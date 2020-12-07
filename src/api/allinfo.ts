import { SerializedItem } from "../serialized/item";
import { SerializedPlatform } from "../serialized/platform";
import { SerializedPlayer } from "../serialized/player";
import { SerializedProjectile } from "../serialized/projectile";
import { SerializedTargetedProjectile } from "../serialized/targetedProjectile";

export interface AllInfo {
    players: SerializedPlayer[];
    platforms: SerializedPlatform[];
    projectiles: SerializedProjectile[];
    targetedProjectiles: SerializedTargetedProjectile[];
    items: SerializedItem[];
}
