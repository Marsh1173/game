import { Size } from "../size";
import { Vector } from "../vector";

export interface SerializedPlayer {
    id: number;
    name: string;
    classType: number;
    weaponEquipped: number;
    position: Vector;
    momentum: Vector;
    color: string;
    size: Size;
    blastCounter: number;
    alreadyJumped: number;
    canJump: boolean;
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
    facing: boolean;
}
