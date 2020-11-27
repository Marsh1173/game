import { Vector } from "../vector";
import { ProjectileType } from "../objects/projectile";
import { SerializedPlayer } from "./player";

export interface SerializedProjectile {
    projectileType: ProjectileType,
    damageType: string,
    damage: number,
    id: number,
    team: number,
    position: Vector,
    momentum: Vector,
    fallSpeed: number,
    knockback: number,
    range: number,
    life: number,
    inGround: boolean
}
