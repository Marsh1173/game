import { ItemType } from "../objects/item";
import { DamageType, effectsClass, Player, PlayerActions } from "../objects/player";
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

export interface LevelUpMessage {
    type: "levelUp";
    id: number;
}

export interface ServerDie {
    type: "serverDie";
    id: number;
}

export interface ServerMoveRight {
    type: "serverMoveRight";
    id: number;
}

export interface ServerMoveLeft {
    type: "serverMoveLeft";
    id: number;
}

export interface ServerJump {
    type: "serverJump";
    id: number;
}

export interface ServerBasicAttack {
    type: "serverBasicAttack";
    id: number;
}

export interface ServerSecondaryAttack {
    type: "serverSecondaryAttack";
    id: number;
}

export interface ServerFirstAbility {
    type: "serverFirstAbility";
    id: number;
}

export interface ServerSecondAbility {
    type: "serverSecondAbility";
    id: number;
}

export interface ServerThirdAbility {
    type: "serverThirdAbility";
    id: number;
}

export interface ServerPlayerUpdate {
    type: "serverPlayerUpdate";
    id: number;
    focusPosition: Vector;
    position: Vector;
    health: number;
}

export type ServerMessage = PlayerInfoMessage |
    PlayerLeavingMessage |
    InfoMessage |
    LevelUpMessage |
    ServerDie |
    ServerMoveRight |
    ServerMoveLeft |
    ServerJump |
    ServerBasicAttack |
    ServerSecondaryAttack |
    ServerFirstAbility |
    ServerSecondAbility |
    ServerThirdAbility |
    ServerPlayerUpdate;

export interface ActionMessage {
    type: "action";
    actionType: PlayerActions;
    id: number;
}

export interface ProjectileMessage {
    type: "projectile";
    projectileType: ProjectileType;
    damageType: DamageType;
    damage: number;
    id: number;
    team: number;
    position: Vector;
    momentum: Vector;
    fallSpeed: number;
    knockback: number;
    range: number;
    life: number;
    inGround: boolean;
}

export interface TargetedProjectileMessage {
    type: "targetedProjectile";
    targetedProjectileType: TargetedProjectileType;
    id: number;
    team: number;
    position: Vector;
    momentum: Vector;
    destination: Vector;
    isDead: boolean;
    life: number;
}

export interface ItemMessage {
    type: "item";
    itemType: ItemType;
    position: Vector;
    momentum: Vector;
    life: number;
}

export interface PlayerUpdate {
    type: "playerUpdate";
    focusPosition: Vector;
    position: Vector;
    health: number;
    id: number;
}

export type ClientMessage = ActionMessage | TargetedProjectileMessage | ProjectileMessage | ItemMessage | PlayerUpdate;
