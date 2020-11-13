import { SerializedBlast } from "../serialized/blast";
import { SerializedPlatform } from "../serialized/platform";
import { SerializedPlayer } from "../serialized/player";
import { SerializedArrow } from "../serialized/arrow";

export interface AllInfo {
    players: SerializedPlayer[];
    blasts: SerializedBlast[];
    platforms: SerializedPlatform[];
    arrows: SerializedArrow[];
}
