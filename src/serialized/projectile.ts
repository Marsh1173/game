import { Vector } from "../vector";

export interface SerializedProjectile {
    projectileType: string,
    damageType: string,
    damage: number,
    id: number,
    team: number,
    image: string,
    position: Vector,
    momentum: Vector,
    angle: number,
    fallSpeed: number,
    knockback: number,
    range: number,
    life: number,
    inGround: boolean
}
