import { config } from "webpack";
import { Config } from "../config";
import { Platform } from "../objects/platform";
import { Player } from "../objects/player";
import { ProjectileType } from "../objects/projectile";
import { TargetedProjectileType } from "../objects/targetedProjectile";
import { Vector } from "../vector";
import { ServerPlayer } from "./player";

export type AIstate = "pacified" | "aggroed";

export class PlayerAI extends ServerPlayer {

    private targetedPlayer?: Player; // the ai's current target
    private station: Vector = {x: this.position.x, y: this.position.y};// the area the ai returns to while out of combat.
    private aiTargetCorrectionSpeed: number = 10; // the higher the number, the longer the delay for the ai's focus to center on the player after movement.

    private basicAttackCounter: number = 0.4; // time between AI attacks in seconds
    private basicAttackCooldown: number = this.basicAttackCounter;

    private basicAttackRange: number = 0;
    private maxPlayerXProximity: number = 0;
    private minPlayerXProximity: number = 0;

    private animationFrameCounter: number = 0;

    constructor(
        config: Config,id: number,team: number,name: string,color: string,classType: number,position: Vector,
        doBlast: (position: Vector, color: string, id: number) => void,
        doProjectile: (projectileType: ProjectileType,damageType: string,damage: number,id: number,team: number,position: Vector,momentum: Vector,fallSpeed: number,knockback: number,range: number,life: number,inGround: boolean) => void,
        doTargetedProjectile: (targetedProjectileType: TargetedProjectileType,id: number,team: number,position: Vector,momentum: Vector,destination: Vector,isDead: boolean,life: number,) => void,
    ) {

        super(config,id,team,name,color,classType,{x: position.x,y: position.y},doBlast,doProjectile,doTargetedProjectile,);
        if (classType === -1) this.setClassStats(0.4, 10, 75, 100, 25); // axe
        else if (classType === -2) this.setClassStats(2, 5, 500, 500, 200); // archer
    }

    private setClassStats(basicAttackCounter: number, aiTargetCorrectionSpeed: number, basicAttackRange: number, maxPlayerXProximity: number, minPlayerXProximity: number) {
        this.basicAttackCounter = basicAttackCounter;
        this.basicAttackCooldown = basicAttackCounter;

        this.aiTargetCorrectionSpeed = aiTargetCorrectionSpeed;
        this.basicAttackRange = basicAttackRange;
        this.maxPlayerXProximity = maxPlayerXProximity;
        this.minPlayerXProximity = minPlayerXProximity;
    }

    private checkProximity(players: Player[]) {
        let meetsConditions: boolean = false;

        if (!this.targetedPlayer) {
            players.forEach((player) => {
                if (player.classType >= 0 && !player.isDead && !player.isStealthed) {
                    const distance: number = Math.sqrt(Math.pow(player.position.x - this.station.x, 2) + Math.pow(player.position.y - this.station.y, 2));
                    if (distance < 400) {
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
                if (player.classType >= 0 && this.targetedPlayer && !player.isDead && !player.isStealthed) {
                    const stationDistance: number = Math.sqrt(Math.pow(player.position.x - this.station.x, 2) + Math.pow(player.position.y - this.station.y, 2));
                    const distance: number = Math.sqrt(Math.pow(player.position.x - this.position.x, 2) + Math.pow(player.position.y - this.position.y, 2));
                    const targetDistance: number = Math.sqrt(Math.pow(this.targetedPlayer.position.x - this.position.x, 2) + Math.pow(this.targetedPlayer.position.y - this.position.y, 2));
                    if (stationDistance < 700 && distance <= targetDistance) {
                        this.targetedPlayer = player;
                        meetsConditions = true;
                    }
                }
            });
        }

        if (!meetsConditions) this.targetedPlayer = undefined;
    }

    update(elapsedTime: number, players: Player[], platforms: Platform[]) {
        if (!this.isDead){
            if (this.targetedPlayer) {

                this.animationFrame = (this.animationFrameCounter + this.animationFrame * 2) / 3; // to smooth rudimentary attack animation

                this.focusPosition.x = (this.targetedPlayer.position.x + this.targetedPlayer.size.width / 2 + this.focusPosition.x * this.aiTargetCorrectionSpeed) / (this.aiTargetCorrectionSpeed + 1); // track player
                this.focusPosition.y = (this.targetedPlayer.position.y + this.targetedPlayer.size.height / 2 + this.focusPosition.y * this.aiTargetCorrectionSpeed) / (this.aiTargetCorrectionSpeed + 1);

            } else {
                //this.focusPosition.x = this.position.x + this.size.width / 2;
                this.focusPosition.y = this.position.y + this.size.height / 2; // level ai focus but keep them facing in the same direction
                this.healPlayer(elapsedTime * 50); // out of combat regen
            }

            this.checkProximity(players);

            if (this.targetedPlayer) {
                const distance: number = Math.sqrt(Math.pow(this.targetedPlayer.position.x - this.position.x, 2) + Math.pow(this.targetedPlayer.position.y - this.position.y, 2));

                if (distance < this.minPlayerXProximity) { // too close to ai?
                    if (this.targetedPlayer.position.x - this.position.x < 0) this.actionsNextFrame.moveRight = true;
                    else  this.actionsNextFrame.moveLeft = true;
                } else if (distance > this.maxPlayerXProximity) {// too far from ai?
                    if (this.targetedPlayer.position.x - this.position.x < 0) this.actionsNextFrame.moveLeft = true;
                    else  this.actionsNextFrame.moveRight = true;
                }


                if (distance < this.basicAttackRange) {
                    if (this.basicAttackCounter < 0 ){
                        this.actionsNextFrame.basicAttack = true;
                        this.animationFrameCounter = 1;
                        this.basicAttackCounter = this.basicAttackCooldown / this.moveSpeedModifier;
                        setTimeout(() => {
                            this.animationFrameCounter = 0;
                        }, 150); 
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
        super.update(elapsedTime, players, platforms);
    }
}
