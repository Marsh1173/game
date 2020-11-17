import { Vector } from "../vector";

export interface SerializedBasicAttack {
    position: Vector;
    angle: number;
    id: number;
    damage: number;
    range: number;
    life: number;
    spread: number;
}
