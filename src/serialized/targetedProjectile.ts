import { Vector } from "../vector";
import { TargetedProjectileType } from "../objects/targetedProjectile";

export interface SerializedTargetedProjectile {
    targetedProjectileType: TargetedProjectileType,
    id: number,
    team: number,
    position: Vector,
    momentum: Vector,
    destination: Vector,
    isDead: boolean,
    life: number,
}
