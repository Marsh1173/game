import { ClassType } from "../classtype";
import { Player } from "../objects/player";
import { Size } from "../size";
import { Vector } from "../vector";
import { Weapon } from "../weapon";

export interface SerializedPlayer {
    id: number;
    team: number;
    name: string;
    classType: ClassType;
    weaponEquipped: Weapon;
    animationFrame: number;
    position: Vector;
    momentum: Vector;
    color: string;
    size: Size;
    blastCounter: number;
    alreadyJumped: number;
    standing: boolean;
    wasStanding: boolean;
    isDead: boolean;
    health: number;
    deathCooldown: number;
    lastHitBy: number;
    killCount: number;
    focusPosition: Vector;
    isCharging: number;
    isHit: boolean;
    isShielded: boolean;
    isStealthed: boolean;
    facing: boolean;
    moveSpeedModifier: number;
    healthModifier: number;
    level: number;
}
