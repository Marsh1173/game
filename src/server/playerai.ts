import { config } from "webpack";
import { AiClassType, ClassType, isPlayerClassType } from "../classtype";
import { Config } from "../config";
import { getRandomWeapon, Item, ItemType } from "../objects/item";
import { Platform } from "../objects/platform";
import { DamageType, Player } from "../objects/player";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { Vector } from "../vector";
import { Game } from "./game";
import { ServerPlayer } from "./player";

export class PlayerAI extends ServerPlayer {

    private targetedPlayer?: Player; // the ai's current target
    private station: Vector = {x: this.position.x, y: this.position.y};// the area the ai returns to while out of combat.
    private aiTargetCorrectionSpeed: number = 10; // the higher the number, the longer the delay for the ai's focus to center on the player after movement.

    private basicAttackCounter: number = 0.4; // time between AI attacks in seconds
    private basicAttackCooldown: number = this.basicAttackCounter;

    private basicAttackRange: number = 0;
    private maxPlayerXProximity: number = 0;
    private minPlayerXProximity: number = 0;

    constructor(
        config: Config,id: number,team: number,name: string,color: string,classType: AiClassType,position: Vector,
        doProjectile: (projectileType: ProjectileType,damageType: DamageType,damage: number,id: number,team: number,position: Vector,momentum: Vector,fallSpeed: number,knockback: number,range: number,life: number,inGround: boolean) => void,
        doTargetedProjectile: (targetedProjectileType: TargetedProjectileType,id: number,team: number,position: Vector,momentum: Vector,destination: Vector,isDead: boolean,life: number,) => void,
        doItem: (itemType: ItemType, id: number, position: Vector,momentum: Vector,life: number,) => void,
    ) {

        super(config,id,team,name,color,classType,{x: position.x,y: position.y},doProjectile,doTargetedProjectile,doItem);
        if (classType === "axeai") this.setClassStats(0.4, 10, 130, 100, 25); // axe
        else if (classType === "archerai") this.setClassStats(2, 5, 500, 500, 50); // archer
    }

    private setClassStats(basicAttackCounter: number, aiTargetCorrectionSpeed: number, basicAttackRange: number, maxPlayerXProximity: number, minPlayerXProximity: number) {
        this.basicAttackCounter = basicAttackCounter;
        this.basicAttackCooldown = basicAttackCounter;

        this.aiTargetCorrectionSpeed = aiTargetCorrectionSpeed;
        this.basicAttackRange = basicAttackRange;
        this.maxPlayerXProximity = maxPlayerXProximity;
        this.minPlayerXProximity = minPlayerXProximity;
    }

    private checkProximity(players: Player[], platforms: Platform[]) {
        let meetsConditions: boolean = false;

        if (!this.targetedPlayer) {
            players.forEach((player) => {
                if (isPlayerClassType(player.classType) && !player.isDead && !player.effects.isStealthed) {
                    const distance: number = Math.sqrt(Math.pow(player.position.x - this.station.x, 2) + Math.pow(player.position.y - this.station.y, 2));
                    if (distance < 400 && this.checkLineOfSightFromPlayer(platforms, player.position.x + player.size.width / 2, player.position.y + player.size.height / 2)) {
                        this.targetedPlayer = player;
                        meetsConditions = true;
                    }
                }
            });
            const aiDistance: number = Math.sqrt(Math.pow(this.position.x - this.station.x, 2) + Math.pow(this.position.y - this.station.y, 2));
            if (!meetsConditions && aiDistance < 200 && aiDistance > 50) {
                this.station.x = this.position.x;
                this.station.y = this.position.y;
            }
        } else {
            players.forEach((player) => {
                if (isPlayerClassType(player.classType) && this.targetedPlayer && !player.isDead && !player.effects.isStealthed) {
                    const stationDistance: number = Math.sqrt(Math.pow(player.position.x - this.station.x, 2) + Math.pow(player.position.y - this.station.y, 2));
                    const distance: number = Math.sqrt(Math.pow(player.position.x - this.position.x, 2) + Math.pow(player.position.y - this.position.y, 2));
                    const targetDistance: number = Math.sqrt(Math.pow(this.targetedPlayer.position.x - this.position.x, 2) + Math.pow(this.targetedPlayer.position.y - this.position.y, 2));
                    if (stationDistance < 700 && distance <= targetDistance && this.checkLineOfSightFromPlayer(platforms, player.position.x + player.size.width / 2, player.position.y + player.size.height / 2)) {
                        this.targetedPlayer = player;
                        meetsConditions = true;
                    }
                }
            });
        }

        if (!meetsConditions) this.targetedPlayer = undefined;
    }

    update(elapsedTime: number, players: Player[], platforms: Platform[], items: Item[], ifPlayerWithId: boolean) {
        if (!this.isDead){

            if (this.actionsNextFrame.die) this.attemptDie();

            if (this.targetedPlayer) {

                this.focusPosition.x = (this.targetedPlayer.position.x + this.targetedPlayer.size.width / 2 + this.focusPosition.x * this.aiTargetCorrectionSpeed) / (this.aiTargetCorrectionSpeed + 1); // track player
                this.focusPosition.y = (this.targetedPlayer.position.y + this.targetedPlayer.size.height / 2 + this.focusPosition.y * this.aiTargetCorrectionSpeed) / (this.aiTargetCorrectionSpeed + 1);

            } else {
                //this.focusPosition.x = this.position.x + this.size.width / 2;
                this.focusPosition.y = this.position.y + this.size.height / 2; // level ai focus but keep them facing in the same direction
                this.healPlayer(elapsedTime * 50); // out of combat regen
            }

            this.checkProximity(players, platforms);

            if (this.targetedPlayer) {
                const distance: number = Math.sqrt(Math.pow(this.targetedPlayer.position.x - this.position.x, 2) + Math.pow(this.targetedPlayer.position.y - this.position.y, 2));
                //distance from ai to target
                const focusDistance: number = Math.sqrt(Math.pow(this.targetedPlayer.position.x - this.focusPosition.x, 2) + Math.pow(this.targetedPlayer.position.y - this.focusPosition.y, 2));
                //distance from ai's cursor to target 

                if (distance < this.minPlayerXProximity) { // too close to ai?
                    if (this.targetedPlayer.position.x - this.position.x < -50) this.actionsNextFrame.moveRight = true;
                    else if (this.targetedPlayer.position.x - this.position.x > 50) this.actionsNextFrame.moveLeft = true;
                } else if (distance > this.maxPlayerXProximity) {// too far from ai?
                    if (this.targetedPlayer.position.x - this.position.x < -50) this.actionsNextFrame.moveLeft = true;
                    else if (this.targetedPlayer.position.x - this.position.x > 50) this.actionsNextFrame.moveRight = true;
                }


                if (distance < this.basicAttackRange && focusDistance < 50) {
                    if (this.basicAttackCounter < 0 ){
                        this.actionsNextFrame.basicAttack = true;
                        this.basicAttackCounter = this.basicAttackCooldown / this.moveSpeedModifier;
                    }
                }
            } else {
                if (this.station.x > this.position.x + 150) {
                    this.actionsNextFrame.moveRight = true;
                } else if (this.station.x < this.position.x - 150) {
                    this.actionsNextFrame.moveLeft = true;
                }
            }
        }

        this.basicAttackCounter -= elapsedTime;
        super.update(elapsedTime, players, platforms, items, ifPlayerWithId);
    }


    protected broadcastActions() {
        Game.broadcastMessage({
            type: "serverPlayerActions",
            id: this.id,
            moveRight: this.actionsNextFrame.moveRight,
            moveLeft: this.actionsNextFrame.moveLeft,
            jump: this.actionsNextFrame.jump,
            basicAttack: this.actionsNextFrame.basicAttack,
            secondaryAttack: this.actionsNextFrame.secondaryAttack,
            firstAbility: this.actionsNextFrame.firstAbility,
            secondAbility: this.actionsNextFrame.secondAbility,
            thirdAbility: this.actionsNextFrame.thirdAbility,
            die: this.actionsNextFrame.die,
            level: this.actionsNextFrame.level,
    
            focusPosition: this.focusPosition,
            position: this.position,
            health: this.health,
        });
        if (this.actionsNextFrame.die) {
            const droppedWeapon: ItemType = getRandomWeapon();
            if (droppedWeapon != "nullItem") {
                Game.broadcastMessage({
                    type: "serverItemMessage",
                    itemType: droppedWeapon,
                    id: Game.itemId,
                    position: {x: this.position.x + 15, y: this.position.y + 15},
                    momentum: {x: 0, y: -100},
                    life: 10,
                });
                this.doItem(droppedWeapon, Game.itemId, {x: this.position.x + 15, y: this.position.y + 15}, {x: 0, y: -100}, 20);
                Game.itemId++;
            }
        }
        
        super.broadcastActions();
    }
}
