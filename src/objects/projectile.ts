import { Config } from "../config";
import { SerializedProjectile } from "../serialized/projectile";
import { Vector } from "../vector";
import { Size } from "../size";
import { Player } from "./player";
import { Platform } from "./platform";

export type ProjectileType = "arrow" | "shuriken" | "ice" | "fire";

export abstract class Projectile {
    constructor(private readonly config: Config,
        public projectileType: ProjectileType, // literal name of the projectile
        public damageType: string, // type of damage
        public damage: number, // amount of damage
        public id: number, // id of player who shot it
        public team: number, // team of player who shot it (not implemented)
        public position: Vector, // (starting) coordinates
        public momentum: Vector, // (starting) momentum?
        public fallSpeed: number, // multiplier for fallspeed based on player fallspeed (zero negates it)
        public knockback: number, // force exerted on player upon hitting (avg. 400)
        public range: number, // hit range extending around projectile. Default is 0
        public life: number, // life span in miliseconds, filter decider (normally decremented if it's stuck in the ground)
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
            /*const points: Vector[] = [
                {
                    // above
                    x: this.position.x,
                    y: object.position.y,
                },
                {
                    // below
                    x: this.position.x,
                    y: object.position.y + object.size.height,
                },
                {
                    // left
                    x: object.position.x,
                    y: this.position.y,
                },
                {
                    // right
                    x: object.position.x + object.size.width,
                    y: this.position.y,
                },
            ];

            const distances = points.map((point) => Math.sqrt((point.x - this.position.x) ** 2 + (point.y - this.position.y) ** 2));

            let smallest = distances[0];
            let smallestIndex = 0;
            distances.forEach((distance, i) => {
                if (distance < smallest) {
                    smallest = distance;
                    smallestIndex = i;
                }
            });

            this.position.x = points[smallestIndex].x;
            this.position.y = points[smallestIndex].y;
            
            switch (smallestIndex) {
                case 0: // above
                    if (this.momentum.x > 700 || this.momentum.x < -700) {
                        this.momentum.y /= -2;
                        this.momentum.x /= 1.3;
                        this.position.y += this.momentum.y * elapsedTime;
                    } else {
                        this.position.y -= Math.min(this.momentum.y / 20, 10);
                        this.inGround = true;
                    }
                    break;
                case 1: // below
                    if (this.momentum.y < 0) {
                        this.momentum.y /= -1.5;
                    }
                    break;
                case 2: // left
                    if (this.momentum.x > 0) {
                        this.momentum.x /= -1.5;
                    }
                    break;
                case 3: // right
                    if (this.momentum.x < 0) this.momentum.x /= -1.5;
                    break;
            }*/
        }
    }

    public checkCollisionWithPlayer(player: Player, elapsedTime: number): boolean {
        //let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        //let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (
            this.position.x < player.position.x + player.size.width &&
            this.position.x > player.position.x &&
            this.position.y < player.position.y + player.size.height &&
            this.position.y > player.position.y &&
            this.id != player.id
        ) {
            if (!player.isDead && !this.inGround) {
                if (!player.isShielded){

                    player.damagePlayer(this.damage, this.id, "projectile", this.damageType);
                    if (this.damageType === "poison") player.dotPlayer(2, this.id, "poison", "elemental", 300, 5);
                    if (this.damageType === "fire") player.dotPlayer(2, this.id, "fire", "elemental", 500, 2);
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
            if (this.fallSpeed != 0 ) this.momentum.y += (this.config.fallingAcceleration * elapsedTime) * this.fallSpeed;

            players.forEach((player) => {
                if(this.id != player.id){
                    if (this.checkCollisionWithPlayer(player, elapsedTime)) {

                        let angle: number = Math.atan(this.momentum.y / this.momentum.x);
                        if(this.momentum.x < 0) angle += Math.PI;
                        player.knockbackPlayer(angle, this.knockback);

                        if (this.projectileType === "ice") {
                            player.moveSpeedModifier /= 2;
                            setTimeout(() => {
                                player.moveSpeedModifier *= 2;
                            }, 2000);
                        }

                        if (this.projectileType === "shuriken") {
                            players.forEach((player2) => {
                                if (player2.id === this.id) player2.movePlayer((player.position.x - player2.position.x) * 1.1, (player.position.y - player2.position.y) * 1.1, true);
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
        } else {
            if (this.projectileType == "fire") {
                this.life = 0;
            } else {
                setTimeout(() => {
                    this.life = 0;
                }, 2000);
            }
        }
    }
}
