import { Vector } from "../vector";

export interface SerializedProjectile {
    position: Vector;
    momentum: Vector;
    id: number;
    inGround: boolean;
    isDead: boolean;
}
