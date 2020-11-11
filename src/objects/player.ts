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
        public readonly id: number,
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
        public doBlast: (position: Vector, color: string) => void,
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
        };
    }

    public checkCollisionWithRectantularObject(object: { size: Size; position: Vector }) {
        if (
            this.position.x < object.position.x + object.size.width &&
            this.position.x + this.size.width > object.position.x &&
            this.position.y < object.position.y + object.size.height &&
            this.position.y + this.size.height > object.position.y
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
                    this.momentum.y = 0;
                    this.standing = true;
                    break;
                case 1: // below
                    this.momentum.y = 0;
                    break;
                case 2: // left
                    this.momentum.x = 0;
                    break;
                case 3: // right
                    this.momentum.x = 0;
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
        this.momentum.y -= config.jumpSize;
        this.alreadyJumped = 2;
        this.canJump = false;
    }

    public attemptMoveLeft() {
        if (!this.isDead && this.momentum.x > -10) {
            this.moveLeft();
        }
    }
    public moveLeft() {
        if (this.standing) {
            this.momentum.x -= 4;
        } else {
            this.momentum.x -= 1;
        }
    }
    public attemptMoveRight() {
        if (!this.isDead && this.momentum.x < 10) {
            this.moveRight();
        }
    }
    public moveRight() {
        if (this.standing) {
            this.momentum.x += 4;
        } else {
            this.momentum.x += 1;
        }
    }

    public attemptBlast() {
        if (!this.isDead && this.blastCounter <= 0) {
            this.blast();
        }
    }
    public blast() {
        this.blastCounter = config.blastCooldown;
        this.doBlast({ x: this.position.x, y: this.position.y }, this.color);
    }

    public die() {
        this.isDead = true;
    }

    public update() {
        // Action handling
        if (this.actionsNextFrame.jump) {
            this.attemptJump();
        } else {
            if (!this.canJump) {
                this.canJump = true;
            }
        }
        if (this.actionsNextFrame.moveLeft) {
            this.attemptMoveLeft();
        }
        if (this.actionsNextFrame.moveRight) {
            this.attemptMoveRight();
        }
        if (this.actionsNextFrame.blast) {
            this.attemptBlast();
        }

        // Falling speed
        if (!this.standing) {
            this.momentum.y += 1;
        }

        // Movement dampening
        if (Math.abs(this.momentum.x) < 1) {
            this.momentum.x = 0;
        } else {
            if (this.standing) {
                this.momentum.x *= 0.8;
            } else {
                this.momentum.x *= 0.98;
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
        this.position.x += this.momentum.x;
        this.position.y += this.momentum.y;

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
            this.momentum.x = Math.max(this.momentum.x, 0);
        } else if (this.position.x + this.size.width > config.xSize) {
            this.position.x = config.xSize - this.size.width;
            this.momentum.x = Math.min(this.momentum.x, 0);
        }

        // update jump counter
        if (this.momentum.y === 0 && this.alreadyJumped > 0) {
            this.alreadyJumped--;
        }

        // Die if you hit the bottom of the screen
        if (!this.isDead && this.position.y >= config.ySize - this.size.height) {
            this.die();
        }

        // Respawn timer
        if (this.isDead) {
            this.deathCooldown--;
            if (this.deathCooldown <= 0) {
                this.isDead = false;
                this.position.x = config.xSize / 2 - this.size.height / 2;
                this.position.y = 200;
                this.deathCooldown = 150;
            }
        }

        // Blast cooldown timer
        if (this.blastCounter > 0) {
            this.blastCounter -= 1;
        }

        // Die if you run out of health?
        if (this.health <= 0) {
            //this.die();
        }

        Object.keys(this.actionsNextFrame).forEach((key) => (this.actionsNextFrame[key as PlayerActions] = false));
    }
}
