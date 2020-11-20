import { SerializedBlast } from "../serialized/blast";
import { SerializedPlatform } from "../serialized/platform";
import { SerializedPlayer } from "../serialized/player";
import { SerializedProjectile } from "../serialized/projectile";

export interface AllInfo {
    players: SerializedPlayer[];
    blasts: SerializedBlast[];
    platforms: SerializedPlatform[];
    projectiles: SerializedProjectile[];
}
