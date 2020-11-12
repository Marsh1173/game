import { config } from "../config";
import { SerializedPlayer } from "../serialized/player";
import { Size } from "../size";
import { Vector } from "../vector";

export type PlayerActions = "jump" | "moveLeft" | "moveRight" | "blast";

export abstract class Player {
    public readonly actionsNextFrame: Record<PlayerActions, boolean> = {
        jump: false,
        moveLeft: false,
        moveRight: false,
        blast: false,
    };

    constructor(
        public id: number,
        public position: Vector,
        public momentum: Vector,
        public color: string,
        public size: Size,
        public blastCounter: number,
        public alreadyJumped: number,
        public canJump: boolean,
        public standing: boolean,
        public wasStanding: boolean,
        public isDead: boolean,
        public health: number,
        public deathCooldown: number,
        public lastHitBy: number,
        public killCount: number,
        public doBlast: (position: Vector, color: string, id: number) => void,
    ) {}

    public serialize(): SerializedPlayer {
        return {
            id: this.id,
            position: this.position,
            momentum: this.momentum,
            color: this.color,
            size: this.size,
            blastCounter: this.blastCounter,
            alreadyJumped: this.alreadyJumped,
            canJump: this.canJump,
            standing: this.standing,
            wasStanding: this.wasStanding,
            isDead: this.isDead,
            health: this.health,
            deathCooldown: this.deathCooldown,
            lastHitBy: this.lastHitBy,
            killCount: this.killCount,
        };
    }

    public checkCollisionWithRectangularObject(object: { size: Size; position: Vector }, elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (
            futurePosX < object.position.x + object.size.width &&
            futurePosX + this.size.width > object.position.x &&
            futurePosY < object.position.y + object.size.height &&
            futurePosY + this.size.height > object.position.y
        ) {
            const points: Vector[] = [
                {
                    // above
                    x: this.position.x,
                    y: object.position.y - this.size.height,
                },
                {
                    // below
                    x: this.position.x,
                    y: object.position.y + object.size.height,
                },
                {
                    // left
                    x: object.position.x - this.size.width,
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
                    if (this.momentum.y > 0) this.momentum.y = 0;
                    this.standing = true;
                    break;
                case 1: // below
                    if (this.momentum.y < 0) this.momentum.y = 0;
                    break;
                case 2: // left
                    if (this.momentum.x > 0) this.momentum.x = 0;
                    break;
                case 3: // right
                    if (this.momentum.x < 0) this.momentum.x = 0;
                    break;
            }
        }
    }

    public attemptJump() {
        if (!this.isDead && this.alreadyJumped <= 0 && this.canJump) {
            this.jump();
        }
    }

    public jump() {
        this.momentum.y = -config.jumpSize;
        this.alreadyJumped = 2;
        this.canJump = false;
    }

    public attemptMoveLeft(elapsedTime: number) {
        if (!this.isDead && this.momentum.x > -config.maxSidewaysMomentum) {
            this.moveLeft(elapsedTime);
        }
    }
    public moveLeft(elapsedTime: number) {
        if (this.standing) {
            this.momentum.x -= config.standingSidewaysAcceleration * elapsedTime;
        } else {
            this.momentum.x -= config.nonStandingSidewaysAcceleration * elapsedTime;
        }
    }
    public attemptMoveRight(elapsedTime: number) {
        if (!this.isDead && this.momentum.x < config.maxSidewaysMomentum) {
            this.moveRight(elapsedTime);
        }
    }
    public moveRight(elapsedTime: number) {
        if (this.standing) {
            this.momentum.x += config.standingSidewaysAcceleration * elapsedTime;
        } else {
            this.momentum.x += config.nonStandingSidewaysAcceleration * elapsedTime;
        }
    }

    public attemptBlast(elapsedTime: number) {
        if (!this.isDead && this.blastCounter <= 0) {
            this.blast(elapsedTime);
        }
    }
    public blast(elapsedTime: number) {
        this.blastCounter = config.blastCooldown;
        this.doBlast({ x: (this.position.x + this.momentum.x * elapsedTime) + this.size.width / 2, y: (this.position.y + this.momentum.y * elapsedTime) + this.size.height / 2 }, this.color, this.id);
    }

    public healPlayer(quantity: number) {
        this.health += quantity;
        if (this.health > 100) {
            this.health = 100;
        }
    }

    public damagePlayer(quantity: number): boolean {
        this.health -= quantity;
        if (this.health <= 0) {
            this.die();
            this.health = 0;
            return true;
        }
        return false;
    }

    public die() {
        console.log(this.id + " was killed by " + this.lastHitBy);
        this.lastHitBy = -1;
        this.isDead = true;
    }

    public resurrect() {
        this.isDead = false;
        this.position.x = config.xSize / 2 - this.size.height / 2;
        this.position.y = 200;
        this.deathCooldown = 150;
        this.health = 100;
    }

    public update(elapsedTime: number) {
        // Action handling
        if (this.actionsNextFrame.jump) {
            this.attemptJump();
        } else {
            if (!this.canJump) {
                this.canJump = true;
            }
        }
        if (this.actionsNextFrame.moveLeft) {
            this.attemptMoveLeft(elapsedTime);
        }
        if (this.actionsNextFrame.moveRight) {
            this.attemptMoveRight(elapsedTime);
        }
        if (this.actionsNextFrame.blast) {
            this.attemptBlast(elapsedTime);
        }

        // Falling speed
        if (!this.standing) {
            this.momentum.y += config.fallingAcceleration * elapsedTime;
        }

        // Movement dampening
        if (Math.abs(this.momentum.x) < 30) {
            this.momentum.x = 0;
        } else {
            if (this.standing) {
                this.momentum.x *= 0.65 ** (elapsedTime * 60);
            } else {
                this.momentum.x *= 0.97 ** (elapsedTime * 60);
            }
        }

        // Set not standing
        if (this.standing === true) {
            this.wasStanding = true;
            this.standing = false;
        } else {
            this.wasStanding = false;
        }

        // Update position based on momentum
        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;

        // Check collision with sides of area
        if (this.position.y < 0) {
            this.position.y = 0;
            this.momentum.y = Math.max(this.momentum.y, 0);
        } else if (this.position.y + this.size.height > config.ySize) {
            this.position.y = config.ySize - this.size.height;
            this.momentum.y = Math.min(this.momentum.y, 0);
            this.standing = true;
        }
        if (this.position.x < 0) {
            this.position.x = 0;
            if (this.momentum.x < -config.maxSidewaysMomentum / 3) {
                this.momentum.x /= -2;
            } else {
                this.momentum.x = 0;
            }
        } else if (this.position.x + this.size.width > config.xSize) {
            this.position.x = config.xSize - this.size.width;
            if (this.momentum.x > config.maxSidewaysMomentum / 3) {
                this.momentum.x /= -2;
            } else {
                this.momentum.x = 0;
            }
        }

        // update jump counter
        if (this.momentum.y === 0 && this.alreadyJumped > 0) {
            this.alreadyJumped -= elapsedTime * 60;
        }

        // get damaged if you hit the bottom of the screen
        if (!this.isDead && this.position.y >= config.ySize - this.size.height) {
            this.damagePlayer(elapsedTime * 120);
        } else if (!this.isDead) {
            this.healPlayer(elapsedTime * 2);
        }

        // Respawn timer
        if (this.isDead) {
            this.deathCooldown -= elapsedTime * 60;
            if (this.deathCooldown <= 0) {
                this.resurrect();
            }
        }

        // Blast cooldown timer
        if (this.blastCounter > 0) {
            this.blastCounter -= elapsedTime * 60;
        }

        Object.keys(this.actionsNextFrame).forEach((key) => (this.actionsNextFrame[key as PlayerActions] = false));
    }
}
