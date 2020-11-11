import { SerializedBlast } from "../serialized/blast";
import { SerializedPlatform } from "../serialized/platform";
import { SerializedPlayer } from "../serialized/player";

export interface AllInfo {
    players: SerializedPlayer[];
    blasts: SerializedBlast[];
    platforms: SerializedPlatform[];
}
