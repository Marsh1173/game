import { AbilityName } from "../objects/abilities";
import { ItemType } from "../objects/item";
import { DamageType, Player, PlayerActions } from "../objects/player";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { SerializedPlayer } from "../serialized/player";
import { Vector } from "../vector";
import { Weapon } from "../weapon";
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

export interface ServerPlayerActions {
    type: "serverPlayerActions",
    id: number,
    moveRight: boolean,
    moveLeft: boolean,
    jump: boolean,
    basicAttack: boolean,
    secondaryAttack: boolean,
    firstAbility: boolean,
    secondAbility: boolean,
    thirdAbility: boolean,
    die: boolean,
    level: boolean,

    focusPosition: Vector;
    position: Vector;
    health: number;
}

export interface ServerPlayerUpdateStats {
    type: "serverPlayerUpdateStats";
    id: number;
    abilityNames: AbilityName[],
    weaponEquipped: Weapon,
}

export interface ServerItemMessage {
    type: "serverItemMessage";
    itemType: ItemType;
    id: number;
    position: Vector;
    momentum: Vector;
    life: number;
}

export interface ServerItemKillMessage {
    type: "serverItemKillMessage";
    id: number;
}

export type ServerMessage = PlayerInfoMessage |
    PlayerLeavingMessage |
    InfoMessage |
    ServerItemMessage |
    ServerItemKillMessage |
    ServerPlayerActions |
    ServerPlayerUpdateStats;

export interface ClientPlayerActions {
    type: "clientPlayerActions",
    id: number,
    moveRight: boolean,
    moveLeft: boolean,
    jump: boolean,
    basicAttack: boolean,
    secondaryAttack: boolean,
    firstAbility: boolean,
    secondAbility: boolean,
    thirdAbility: boolean,
    die: boolean,
    level: boolean,
    
    focusPosition: Vector,
    position: Vector,
    health: number,
}

export interface ActionMessage { //NO LONGER USED
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

export interface ItemKillMessage {
    type: "itemKillMessage";
    id: number;
}

export interface PlayerUpdateStats {
    type: "playerUpdateStats";
    id: number;
    abilityNames: AbilityName[],
    weaponEquipped: Weapon,
}

export type ClientMessage = ActionMessage | TargetedProjectileMessage | ProjectileMessage | ItemKillMessage | PlayerUpdateStats | ClientPlayerActions;
