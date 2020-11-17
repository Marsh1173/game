import { Config } from "../config";
import { SerializedPlayer } from "../serialized/player";
import { Size } from "../size";
import { Vector } from "../vector";

export type PlayerActions = "jump" | "moveLeft" | "moveRight" | "blast" | "arrow" | "basicAttack";

export abstract class Player {
    public shieldCount = setTimeout(() => "", 1);

    public readonly actionsNextFrame: Record<PlayerActions, boolean> = {
        jump: false,
        moveLeft: false,
        moveRight: false,
        blast: false,
        arrow: false,
        basicAttack: false,
    };

    constructor(
        private readonly config: Config,
        public id: number,
        public name: string,
        public classType: number,
        public weaponEquipped: number,
        public animationFrame: number,
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
        public focusPosition: Vector,
        public isCharging: number,
        public isHit: boolean,
        public isShielded: boolean,
        public facing: boolean,
        public doBlast: (position: Vector, color: string, id: number) => void,
        public doArrow: (position: Vector, momentum: Vector, id: number) => void,
        public doBasicAttack: (position: Vector, angle: number, id: number, damage: number, range: number, life: number, spread: number) => void,
    ) {}

    public serialize(): SerializedPlayer {
        return {
            id: this.id,
            name: this.name,
            classType: this.classType,
            weaponEquipped: this.weaponEquipped,
            animationFrame: this.animationFrame,
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
            focusPosition: this.focusPosition,
            isCharging: this.isCharging,
            isHit: this.isHit,
            isShielded: this.isShielded,
            facing: this.facing,
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
        this.momentum.y = -this.config.playerJumpHeight;
        this.alreadyJumped = 2;
        this.canJump = false;
    }

    public attemptMoveLeft(elapsedTime: number) {
        if (!this.isDead && this.momentum.x > -this.config.maxSidewaysMomentum) {
            this.moveLeft(elapsedTime);
        }
    }
    public moveLeft(elapsedTime: number) {
        if (this.standing) {
            this.momentum.x -= this.config.standingSidewaysAcceleration * elapsedTime;
        } else {
            this.momentum.x -= this.config.nonStandingSidewaysAcceleration * elapsedTime;
        }
    }
    public attemptMoveRight(elapsedTime: number) {
        if (!this.isDead && this.momentum.x < this.config.maxSidewaysMomentum) {
            this.moveRight(elapsedTime);
        }
    }
    public moveRight(elapsedTime: number) {
        if (this.standing) {
            this.momentum.x += this.config.standingSidewaysAcceleration * elapsedTime;
        } else {
            this.momentum.x += this.config.nonStandingSidewaysAcceleration * elapsedTime;
        }
    }

    public attemptBlast(elapsedTime: number) {
        if (!this.isDead && this.blastCounter <= 0) {
            this.blast(elapsedTime);
        }
    }
    public blast(elapsedTime: number) {
        this.blastCounter = this.config.blastCooldown;
        this.doBlast(
            {
                x: this.position.x + this.momentum.x * elapsedTime + this.size.width / 2,
                y: this.position.y + this.momentum.y * elapsedTime + this.size.height / 2,
            },
            this.color,
            this.id,
        );
    }

    public attemptArrow() {
        this.arrow();
    }
    public arrow() {
        const power: number = 100;

        let newX = Math.sqrt(power - Math.pow(this.focusPosition.y, 2));
        let newY = Math.sqrt(power - Math.pow(this.focusPosition.x, 2));

        if (this.focusPosition.x < 0) newX *= -1;
        if (this.focusPosition.y < 0) newY *= -1;

        this.doArrow({ x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 }, { x: newX, y: newY }, this.id);
    }

    public attemptBasicAttack(elapsedTime: number) {
        this.basicAttack(elapsedTime);
    }
    public basicAttack(elapsedTime: number) {
        let newX: number = (this.focusPosition.x - this.position.x - this.size.width / 2);
        let newY: number = (this.focusPosition.y - this.position.y - this.size.height / 2);
        let angle: number = Math.atan(newY / newX);
        if(newX < 0) angle += Math.PI;


        if (this.classType === 0) this.doBasicAttack( // ninja basic attack
            {
                x: this.position.x + this.momentum.x * elapsedTime + this.size.width / 2,
                y: this.position.y + this.momentum.y * elapsedTime + this.size.height / 2,
            },
            angle,
            this.id,
            20,
            70,
            1,
            40,
        );
         else if (this.classType === 1) this.doBasicAttack( // wizard basic attack
            {
                x: this.position.x + this.momentum.x * elapsedTime + this.size.width / 2,
                y: this.position.y + this.momentum.y * elapsedTime + this.size.height / 2,
            },
            angle,
            this.id,
            8,
            175,
            1,
            125,
        );
         else if (this.classType === 2) this.doBasicAttack( // templar basic attack
            {
                x: this.position.x + this.momentum.x * elapsedTime + this.size.width / 2,
                y: this.position.y + this.momentum.y * elapsedTime + this.size.height / 2,
            },
            angle,
            this.id,
            10,
            90,
            1,
            60,
        );
    }

    public wasHit() {
        this.isHit = true;
        setTimeout(() => {
            this.isHit = false;
        }, 40);
    }

    public healPlayer(quantity: number) {
        this.health += quantity;
        if (this.health > 100) {
            this.health = 100;
        }
    }

    public damagePlayer(quantity: number, id: number): boolean {
        if (id != -1) this.lastHitBy = id;

        if (this.classType === 0) this.health -= quantity * 1.2;
        else if (this.classType === 1) this.health -= quantity;
        else if (this.classType === 2) this.health -= quantity * 0.8;

        this.wasHit();

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
        this.position.x = this.config.xSize / 2 - this.size.height / 2;
        this.position.y = 200;
        this.deathCooldown = 150;
        this.health = 100;
        this.momentum.x = 0;
        this.momentum.y = 0;
        this.isShielded = true;
        clearTimeout(this.shieldCount);
        this.shieldCount = setTimeout(() => {
            this.isShielded = false;
        }, 3000);
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
        if (this.actionsNextFrame.arrow) {
            this.attemptArrow();
        }
        if (this.actionsNextFrame.basicAttack) {
            this.attemptBasicAttack(elapsedTime);
        }

        // Falling speed
        if (!this.standing) {
            this.momentum.y += this.config.fallingAcceleration * elapsedTime;
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

        if (!this.isDead && (this.focusPosition.x - this.position.x - this.size.width / 2) > 0) this.facing = true;
        else if (!this.isDead) this.facing = false;

        // Update position based on momentum
        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;

        // Check collision with sides of area
        if (this.position.y < 0) {
            this.position.y = 0;
            this.momentum.y = Math.max(this.momentum.y, 0);
        } else if (this.position.y + this.size.height > this.config.ySize) {
            this.position.y = this.config.ySize - this.size.height;
            this.momentum.y = Math.min(this.momentum.y, 0);
            this.standing = true;
        }
        if (this.position.x < 0) {
            this.position.x = 0;
            if (this.momentum.x < -this.config.maxSidewaysMomentum / 3) {
                this.momentum.x /= -2;
            } else {
                this.momentum.x = 0;
            }
        } else if (this.position.x + this.size.width > this.config.xSize) {
            this.position.x = this.config.xSize - this.size.width;
            if (this.momentum.x > this.config.maxSidewaysMomentum / 3) {
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
        if (!this.isShielded && !this.isDead && this.position.y >= this.config.ySize - this.size.height) {
            this.damagePlayer(elapsedTime * 120, -1);
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
