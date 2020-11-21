import { Config } from "../config";
import { Player, PlayerActions } from "../objects/player";
import { Vector } from "../vector";

export class ServerPlayer extends Player {
    public actionList: PlayerActions[] = [];

    constructor(
        config: Config,
        id: number,
        name: string,
        color: string,
        classType: number,
        doBlast: (position: Vector, color: string, id: number) => void,
        doProjectile: (projectileType: string,
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
            inGround: boolean) => void,
    ) {
        super(
            config,
            id,
            name,
            classType,
            0,
            0,
            {
                x: config.xSize / 8,
                y: (config.ySize * 3) / 4 - config.playerSize,
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
            true,
            doBlast,
            doProjectile,
        );
    }
}
