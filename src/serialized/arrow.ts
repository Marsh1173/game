import { Vector } from "../vector";

export interface SerializedArrow {
    position: Vector;
    momentum: Vector;
    id: number;
    inGround: boolean;
    isDead: boolean;
}
