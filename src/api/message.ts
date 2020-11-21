import { Player, PlayerActions } from "../objects/player";
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

export type ClientMessage = ActionMessage | ProjectileMessage | MouseMessage | AnimateMessage;
