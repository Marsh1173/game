import { Config } from "../config";
import { SerializedProjectile } from "../serialized/projectile";
import { Vector } from "../vector";
import { Size } from "../size";
import { Player } from "./player";

export abstract class Projectile {
    constructor(private readonly config: Config,
        public projectileType: string, // literal name of the projectile
        public damageType: string, // type of damage
        public damage: number, // amount of damage
        public id: number, // id of player who shot it
        public team: number, // team of player who shot it (not implemented)
        public image: string, // path to image file
        public position: Vector, // (starting) coordinates
        public momentum: Vector, // (starting) momentum?
        public angle: number, // probably not needed, since momentum is included
        public fallSpeed: number, // speed at which the projectile falls down 
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
            image: this.image,
            position: this.position,
            momentum: this.momentum,
            angle: this.angle,
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

    public checkCollisionWithPlayer(player: Player, elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (
            futurePosX < player.position.x + player.size.width &&
            futurePosX > player.position.x &&
            futurePosY < player.position.y + player.size.height &&
            futurePosY > player.position.y &&
            this.id != player.id
        ) {
            if (!player.isDead && !this.inGround) {
                if (!player.isShielded) player.damagePlayer(5, this.id, "projectile", "piercing");
                this.life = 0;
                player.momentum.x += this.momentum.x / 5;
                player.momentum.y += this.momentum.y / 5;
            }
        }
    }

    public checkSideCollision(elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;

        if (futurePosY < 5 || futurePosY > this.config.ySize) {
            this.inGround = true;
        } else if (futurePosY > this.config.ySize) {
            this.inGround = true;
        }
        if (futurePosX < 0) {
            this.inGround = true;
        } else if (futurePosX > this.config.xSize) {
            this.inGround = true;
        }
    }

    public update(elapsedTime: number) {
        if (!this.inGround) {
            this.momentum.y += (this.config.fallingAcceleration * elapsedTime) / 2.7;

            /*if (this.position.y < 5) {
                this.momentum.y /= -1.5;
                this.position.y += this.momentum.y * elapsedTime;
            } else if (this.position.y > this.config.ySize) {
                if (this.momentum.x > 700 || this.momentum.x < -700) {
                    this.momentum.y /= -2;
                    this.momentum.x /= 1.3;
                    this.position.y += this.momentum.y * elapsedTime;
                } else {
                    this.inGround = true;
                }
            }
            if (this.position.x < 0) {
                this.position.x = 0;
                this.momentum.x /= -1.2;
            } else if (this.position.x > this.config.xSize) {
                this.position.x = this.config.xSize;
                this.momentum.x /= -1.2;
            }*/

            this.checkSideCollision(elapsedTime);

            if (!this.inGround){
                this.position.x += this.momentum.x * elapsedTime;
                this.position.y += this.momentum.y * elapsedTime;
            }
        } else {
            setTimeout(() => {
                this.life = 0;
            }, 2000);
        }
    }
}
