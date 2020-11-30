import { config } from "webpack";
import { Config } from "../config";
import { Platform } from "../objects/platform";
import { Player } from "../objects/player";
import { Vector } from "../vector";
import { ServerPlayer } from "./player";

export type AIstate = "pacified" | "aggroed";

export class PlayerAI extends ServerPlayer {

    //public state: AIstate = "pacified";
    public targetedPlayer?: Player;
    public station: Vector = {
        x: this.position.x,
        y: this.position.y
    };
    public basicAttackCounter: number = 0.4; // time between AI attacks in seconds
    public basicAttackCooldown: number = this.basicAttackCounter;

    public animationFrameCounter: number = 0;


    public checkProximity(players: Player[]) {
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

                this.animationFrame = (this.animationFrameCounter + this.animationFrame * 2) / 3; // smooth rudimentary attack animation

                this.focusPosition.x = (this.targetedPlayer.position.x + this.targetedPlayer.size.width / 2 + this.focusPosition.x * 5) / 6; // track player
                this.focusPosition.y = (this.targetedPlayer.position.y + this.targetedPlayer.size.height / 2 + this.focusPosition.y * 5) / 6;

            } else {
                //this.focusPosition.x = this.position.x + this.size.width / 2;
                this.focusPosition.y = this.position.y + this.size.height / 2; // level ai focus but keep them facing in the same direction
                this.healPlayer(elapsedTime * 50); // out of combat regen
            }

            this.checkProximity(players);

            if (this.targetedPlayer) {
                if (this.targetedPlayer.position.x > this.position.x + 75) {
                    this.actionsNextFrame.moveRight = true;
                } else if (this.targetedPlayer.position.x < this.position.x - 75) {
                    this.actionsNextFrame.moveLeft = true;
                } else if (this.targetedPlayer.position.y < this.position.y + 25 && this.targetedPlayer.position.y > this.position.y - 75) { // if they're close enough y-wise
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
                if (this.station.x > this.position.x + 50) {
                    this.actionsNextFrame.moveRight = true;
                } else if (this.station.x < this.position.x - 50) {
                    this.actionsNextFrame.moveLeft = true;
                }
            }
        }

        this.basicAttackCounter -= elapsedTime;
        super.update(elapsedTime, players, platforms);
    }
}
