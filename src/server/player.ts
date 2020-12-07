import { Game } from "../server/game";
import { Config } from "../config";
import { DamageType, Player, PlayerActions } from "../objects/player";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { Vector } from "../vector";
import { ClassType } from "../classtype";
import { Weapon } from "../weapon";
import { ItemType } from "../objects/item";

export class ServerPlayer extends Player {
    public actionList: PlayerActions[] = [];

    constructor(
        config: Config,
        id: number,
        team: number,
        name: string,
        color: string,
        classType: ClassType,
        position: Vector,
        doProjectile: (
            projectileType: ProjectileType,
            damageType: DamageType,
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
        doItem: (
            itemType: ItemType,
            position: Vector,
            momentum: Vector,
            life: number,
        ) => void,
    ) {
        super(
            config,
            id,
            team,
            name,
            classType,
            decideClassWeapon(classType),
            0,
            {
                x: position.x,
                y: position.y,
            },
            { x: 0, y: 0 },
            color,
            { width: config.playerSize.x, height: config.playerSize.y },
            0,
            0,
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
            0,
            doProjectile,
            doTargetedProjectile,
            doItem,
        );
    }

    protected levelUp() {
        super.levelUp();
        Game.broadcastMessage({
            type: "levelUp",
            id: this.id,
        });
    }

    public die() {
        super.die();
        Game.broadcastMessage({
            type: "die",
            id: this.id,
        });
    }

    public ninjaFirstAbility() {
        super.ninjaFirstAbility();
        Game.broadcastMessage({
            type: "stealth",
            id: this.id,
        });
    }
}

function decideClassWeapon(classType: ClassType): Weapon {
    switch (classType) {
        case "axeai" :
            return "axe";
        case "archerai" :
            return "bow";
        case "ninja" :
            return "dagger";
        case "wizard" :
            return "staff";
        case "warrior" :
            return "hammer";
        default:
            return "none";
    }
}