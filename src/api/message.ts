import { Player, PlayerActions } from "../objects/player";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { SerializedPlayer } from "../serialized/player";
import { Vector } from "../vector";
import { AllInfo } from "./allinfo";

export interface PlayerInfoMessage {
    type: "playerInfo";
    id: number;
    info: SerializedPlayer;
}

export interface PlayerLeavingMessage {
    type: "playerLeaving";
    id: number;
}

export interface InfoMessage {
    type: "info";
    info: AllInfo;
}

export type ServerMessage = PlayerInfoMessage | PlayerLeavingMessage | InfoMessage;

export interface ActionMessage {
    type: "action";
    actionType: PlayerActions;
    id: number;
}

export interface ProjectileMessage {
    type: "projectile";
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

export interface TargetedProjectileMessage {
    type: "targetedProjectile";
    targetedProjectileType: TargetedProjectileType,
    id: number,
    team: number,
    position: Vector,
    momentum: Vector,
    destination: Vector,
    isDead: boolean,
    life: number
}

export interface MouseMessage {
    type: "moveMouse";
    position: Vector;
    id: number;
}

export interface AnimateMessage {
    type: "animate";
    animationFrame: number;
    id: number;
}

export type ClientMessage = ActionMessage | TargetedProjectileMessage | ProjectileMessage | MouseMessage | AnimateMessage;
