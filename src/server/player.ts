import { Config } from "../config";
import { Player, PlayerActions } from "../objects/player";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { Vector } from "../vector";

export class ServerPlayer extends Player {
    public actionList: PlayerActions[] = [];

    constructor(
        config: Config,
        id: number,
        name: string,
        color: string,
        classType: number,
        position: Vector,
        doBlast: (position: Vector, color: string, id: number) => void,
        doProjectile: (
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
            inGround: boolean,
        ) => void,
        doTargetedProjectile: (
            targetedProjectileType: TargetedProjectileType,
            id: number,
            team: number,
            position: Vector,
            momentum: Vector,
            destination: Vector,
            isDead: boolean,
            life: number,
        ) => void,
    ) {
        super(
            config,
            id,
            name,
            classType,
            0,
            0,
            {
                x: position.x,
                y: position.y,
            },
            { x: 0, y: 0 },
            color,
            { width: config.playerSize, height: config.playerSize },
            0,
            0,
            true,
            false,
            false,
            false,
            100,
            150,
            -1,
            0,
            {
                x: 0,
                y: 0,
            },
            0,
            false,
            false,
            false,
            true,
            1,
            0,
            1,
            doBlast,
            doProjectile,
            doTargetedProjectile,
        );
    }
}
