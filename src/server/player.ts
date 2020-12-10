import { Game } from "../server/game";
import { Config } from "../config";
import { DamageType, Player, PlayerAbilityClass, PlayerActions } from "../objects/player";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { Vector } from "../vector";
import { ClassType, isPlayerClassType } from "../classtype";
import { Weapon } from "../weapon";
import { getRandomWeapon, Item, ItemType } from "../objects/item";
import { Platform } from "../objects/platform";

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
            {isShielded: false, isStealthed: false, isSlowed: 1},
            [new PlayerAbilityClass("basicAttack", false, 0, 0),
            new PlayerAbilityClass("shurikenToss", false, 0, 0),
            new PlayerAbilityClass("blizzard", false, 0, 0),
            new PlayerAbilityClass("meteorStrike", false, 0, 0),
            new PlayerAbilityClass("charge", false, 0, 0),],
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

    /*public attemptDie() {
        super.attemptDie();
        Game.broadcastMessage({
            type: "serverDie",
            id: this.id,
        });
        this.die();
    }

    public attemptBasicAttack(players: Player[], items: Item[]) {
        //console.log("tried basic attack");
        super.attemptBasicAttack(players, items);
        Game.broadcastMessage({
            type: "serverBasicAttack",
            id: this.id,
        });
    }*/

    /*public attemptSecondaryAttack(players: Player[], platforms: Platform[]) {
        //console.log("tried secondary attack");
        super.attemptSecondaryAttack(players, platforms);
        Game.broadcastMessage({
            type: "serverSecondaryAttack",
            id: this.id,
        });
    }

    public attemptFirstAbility(players: Player[], platforms: Platform[]) {
        //console.log("tried First Ability");
        super.attemptFirstAbility(players, platforms);
        Game.broadcastMessage({
            type: "serverFirstAbility",
            id: this.id,
        });
    }*/

    /*public attemptMoveRight(elapsedTime: number) {
        //console.log("tried to move right");
        super.attemptMoveRight(elapsedTime);
        this.moveRight(elapsedTime);
        Game.broadcastMessage({
            type: "serverMoveRight",
            id: this.id,
        });
    }*/

    /*public attemptMoveLeft(elapsedTime: number) {
        //console.log("tried to move left");
        super.attemptMoveLeft(elapsedTime);
        this.moveLeft(elapsedTime);
        Game.broadcastMessage({
            type: "serverMoveLeft",
            id: this.id,
        });
    }*/

    /*public attemptJump() {
        //console.log("tried to jump server-side");
        super.attemptJump();
        this.jump();
        Game.broadcastMessage({
            type: "serverJump",
            id: this.id,
        });
    }*/
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