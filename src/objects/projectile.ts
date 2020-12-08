import { Config } from "../config";
import { SerializedProjectile } from "../serialized/projectile";
import { Vector } from "../vector";
import { Size } from "../size";
import { DamageType, Player } from "./player";
import { Platform } from "./platform";

export type ProjectileType = "arrow" | "shuriken" | "ice" | "fire";

export abstract class Projectile {


    public isFrozen: number = 1; // is multiplied by the elapsed time

    constructor(private readonly config: Config,
        public projectileType: ProjectileType, // literal name of the projectile
        public damageType: DamageType, // type of damage
        public damage: number, // amount of damage
        public id: number, // id of player who shot it
        public team: number, // team of player who shot it (not implemented)
        public position: Vector, // (starting) coordinates
        public momentum: Vector, // (starting) momentum?
        public fallSpeed: number, // multiplier for fallspeed based on player fallspeed (zero negates it)
        public knockback: number, // force exerted on player upon hitting (avg. 400)
        public range: number, // hit range extending around projectile. Default is 0
        public life: number, // life span in seconds, filter decider (normally decremented if it's stuck in the ground)
        public inGround: boolean // self explanatory
        ) {}

    public serialize(): SerializedProjectile {
        return {
            projectileType: this.projectileType,
            damageType: this.damageType,
            damage: this.damage,
            id: this.id,
            team: this.team,
            position: this.position,
            momentum: this.momentum,
            fallSpeed: this.fallSpeed,
            knockback: this.knockback,
            range: this.range,
            life: this.life,
            inGround: this.inGround,
        };
    }

    public checkCollisionWithRectangularObject(object: { size: Size; position: Vector }, elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (
            futurePosX < object.position.x + object.size.width &&
            futurePosX > object.position.x &&
            futurePosY < object.position.y + object.size.height &&
            futurePosY > object.position.y
        ) {
            this.position.y = (futurePosY + this.position.y) / 2;
            this.position.x = (futurePosX + this.position.x) / 2;
            this.inGround = true;
        }
    }

    public checkCollisionWithPlayer(player: Player, elapsedTime: number): boolean {
        if (
            this.position.x < player.position.x + player.size.width &&
            this.position.x > player.position.x &&
            this.position.y < player.position.y + player.size.height &&
            this.position.y > player.position.y &&
            this.id != player.id
        ) {
            if (!player.isDead && !this.inGround) {
                if (!player.effects.isShielded){

                    if (this.projectileType === "shuriken") {
                        player.dotPlayer(2, this.id, this.team, "magic", 500, 4);
                        player.damagePlayer(this.damage, this.id, this.team, this.damageType);
                        player.moveSpeedModifier /= 1.4;
                            setTimeout(() => {
                                player.moveSpeedModifier *= 1.4;
                            }, 1000);
                    } else if (this.projectileType === "fire") player.dotPlayer(1, this.id, this.team, "magic", 300, 4);
                    else player.damagePlayer(this.damage, this.id, this.team, this.damageType);
                    
                }
                this.life = 0;
                this.inGround = true;

                return true;
            }
        }
        return false;
    }

    public checkSideCollision(elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;

        if (futurePosY < 5 || futurePosY > this.config.ySize) {
            this.position.y = (futurePosY + this.position.y) / 2;
            this.position.x = (futurePosX + this.position.x) / 2;
            this.inGround = true;
        } else if (futurePosY > this.config.ySize) {
            this.position.y = (futurePosY + this.position.y) / 2;
            this.position.x = (futurePosX + this.position.x) / 2;
            this.inGround = true;
        }
        if (futurePosX < 0) {
            this.position.y = (futurePosY + this.position.y) / 2;
            this.position.x = (futurePosX + this.position.x) / 2;
            this.inGround = true;
        } else if (futurePosX > this.config.xSize) {
            this.position.y = (futurePosY + this.position.y) / 2;
            this.position.x = (futurePosX + this.position.x) / 2;
            this.inGround = true;
        }
    }

    public update(elapsedTime: number, players: Player[], platforms: Platform[]) {
        if (!this.inGround) {
            
            elapsedTime *= this.isFrozen;

            if (this.fallSpeed != 0 ) this.momentum.y += (this.config.fallingAcceleration * elapsedTime) * this.fallSpeed;

            players.forEach((player) => {
                if(this.id != player.id && this.team != player.team){
                    if (this.checkCollisionWithPlayer(player, elapsedTime)) {

                        let angle: number = Math.atan(this.momentum.y / this.momentum.x);
                        if(this.momentum.x < 0) angle += Math.PI;
                        player.knockbackPlayer(angle, this.knockback);

                        if (this.projectileType === "ice") {
                            player.moveSpeedModifier /= 2;
                            setTimeout(() => {
                                player.moveSpeedModifier *= 2;
                            }, 2000);
                        } else if (this.projectileType === "shuriken") {
                            players.forEach((player2) => {
                                if (player2.id === this.id) {
                                    player2.revealStealthed(500);
                                    player2.teleportPlayer((player.position.x - player2.position.x), (player.position.y - player2.position.y), true);
                                }
                            });
                        } else if (this.projectileType === "fire") {
                            players.forEach((player2) => {
                                const distance: number = Math.sqrt(Math.pow(player2.position.x - this.position.x, 2) + Math.pow(player2.position.y - this.position.y, 2))
                                if (player2.id != this.id && this.team != player.team && distance < 70) {
                                    player2.damagePlayer(this.damage, this.id, this.team, this.damageType);
                                }
                            });
                        }
                    }
                }
            });

        
            if (!this.inGround) {
                platforms.forEach((platform) => {
                    this.checkCollisionWithRectangularObject(platform, elapsedTime / 4);
                    if (!this.inGround)this.checkCollisionWithRectangularObject(platform, elapsedTime / 2);
                    if (!this.inGround)this.checkCollisionWithRectangularObject(platform, elapsedTime);
                });
            }

            this.checkSideCollision(elapsedTime);

            if (!this.inGround){
                this.position.x += this.momentum.x * elapsedTime;
                this.position.y += this.momentum.y * elapsedTime;
            }
            if (this.projectileType == "fire") {
                this.life  -= elapsedTime;
            }
        } else {
            if (this.projectileType == "fire") {
                this.life = 0;
            } else {
                this.life -= elapsedTime;
            }
        }
    }
}
