import { config } from "../config";
import { SerializedArrow } from "../serialized/arrow";
import { Vector } from "../vector";
import { Size } from "../size";
import { Player } from "./player";

export abstract class Arrow {
    constructor(public readonly position: Vector, public momentum: Vector, public id: number, public inGround: boolean) {}

    public serialize(): SerializedArrow {
        return {
            position: this.position,
            momentum: this.momentum,
            id: this.id,
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
            const points: Vector[] = [
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
                    if (this.momentum.y > 500) {
                        this.momentum.y /= -2;
                    } else {
                        this.inGround = true;
                    }
                    break;
                case 1: // below
                    if (this.momentum.y < 0) this.momentum.y /= -2;
                    break;
                case 2: // left
                    if (this.momentum.x > 0) this.momentum.x /= -2;
                    break;
                case 3: // right
                    if (this.momentum.x < 0) this.momentum.x /= -2;
                    break;
            }
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
            if (!player.isDead) {
                player.damagePlayer(30);
                player.lastHitBy = this.id;
                this.inGround = true;
            }
        }
    }

    public update(elapsedTime: number) {
        this.momentum.y += config.fallingAcceleration * elapsedTime / 1.5;

        if (this.position.y < 0) {
            this.momentum.y /= -2;
        } else if (this.position.y > config.ySize) {
            if (this.momentum.y > 200) {
                this.momentum.y /= -3;
            } else {
                this.inGround = true;
            }
        }
        if (this.position.x < 0) {
            this.position.x = 0;
            this.momentum.x /= -2;

        } else if (this.position.x > config.xSize) {
            this.position.x = config.xSize;
            this.momentum.x /= -2;
        }

        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;
    }
}
