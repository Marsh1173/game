import { Config } from "../config";
import { SerializedPlayer } from "../serialized/player";
import { Size } from "../size";
import { Vector } from "../vector";
import { ProjectileType } from "./projectile";
import { TargetedProjectileType } from "./targetedProjectile";
import { Platform } from "./platform";
import { ParticleSystem } from "../client/particle";

export type PlayerActions = "jump" | "moveLeft" | "moveRight" | "blast" | "basicAttack" | "secondaryAttack" | "firstAbility";

export abstract class Player {
    private static nextId = 0;
    public static getNextId() {
        return Player.nextId++;
    }

    public shieldCount = setTimeout(() => "", 1);
    public stealthCount = setTimeout(() => "", 1);

    public AttackModifier: number = 0;

    public readonly actionsNextFrame: Record<PlayerActions, boolean> = {
        jump: false,
        moveLeft: false,
        moveRight: false,
        blast: false,
        basicAttack: false,
        secondaryAttack: false,
        firstAbility: false,
    };

    constructor(
        public readonly config: Config,
        public id: number,
        //public team: number,
        public name: string,
        public classType: number,
        public weaponEquipped: number, //NOT BEING USED ATM
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
        public killCount: number, //NOT BEING USED ATM
        public focusPosition: Vector, // mouse position
        public isCharging: number,
        public isHit: boolean, // quick true/false if they've been hit in the last moment
        public isShielded: boolean,
        public isStealthed: boolean,
        public facing: boolean, // true if facing right, false for left
        public moveSpeedModifier: number, // multiplied by their movespeed and jump height.
        public healthModifier: number,
        public level: number,
        //public damageMitigation: number, // divides the damage taken
        public doBlast: (position: Vector, color: string, id: number) => void,
        public doProjectile: (
            projectileType: ProjectileType,
            damageType: string,
            damage: number,
            id: number,
            team: number,
            position: Vector,
            momentum: Vector,
            fallSpeed: number,
            knockback: number,
            range: number,
            life: number,
            inGround: boolean,
        ) => void,
        public doTargetedProjectile: (
            targetedProjectileType: TargetedProjectileType,
            id: number,
            team: number,
            position: Vector,
            momentum: Vector,
            destination: Vector,
            isDead: boolean,
            life: number,
        ) => void,

        public oldColor: string = color,
    ) {}

    public serialize(): SerializedPlayer {
        return {
            id: this.id,
            //team: this.team,
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
            isStealthed: this.isStealthed,
            facing: this.facing,
            moveSpeedModifier: this.moveSpeedModifier,
            healthModifier: this.healthModifier,
            level: this.level,
            //damageMitigation: this.damageMitigation,
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
        this.momentum.y = -this.config.playerJumpHeight * this.moveSpeedModifier;
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
            this.momentum.x -= this.config.standingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
        } else {
            this.momentum.x -= this.config.nonStandingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
        }
    }
    public attemptMoveRight(elapsedTime: number) {
        if (!this.isDead && this.momentum.x < this.config.maxSidewaysMomentum) {
            this.moveRight(elapsedTime);
        }
    }
    public moveRight(elapsedTime: number) {
        if (this.standing) {
            this.momentum.x += this.config.standingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
        } else {
            this.momentum.x += this.config.nonStandingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
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

    public attemptProjectile() {
        this.projectile();
    }
    public projectile() {
        const power: number = 100;

        let newX = Math.sqrt(power - Math.pow(this.focusPosition.y, 2));
        let newY = Math.sqrt(power - Math.pow(this.focusPosition.x, 2));

        if (this.focusPosition.x < 0) newX *= -1;
        if (this.focusPosition.y < 0) newY *= -1;

        this.doProjectile(
            "arrow",
            "piercing",
            15,
            this.id,
            this.id,
            { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            { x: newX, y: newY },
            10, // should be tested
            400,
            0,
            800, // test
            false,
        );
    }

    public attemptBasicAttack(players: Player[]) {
        if (!this.isDead) {
            this.basicAttack(players);
            this.animationFrame = 1.5;
            setTimeout(() => {
                this.animationFrame = 0;
            }, 50);
        }
    }
    public basicAttack(players: Player[]) {

        let newX: number = this.focusPosition.x - this.position.x - this.size.width / 2;
        let newY: number = this.focusPosition.y - this.position.y - this.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        //console.log(players); //DEBUGGING

        if (this.classType === 1) this.wizardBasicAttack();
        else {
            players.forEach((player) => {
                if (player.id != this.id) {
                    if (this.classType === -1)
                        this.basicAttackTemplate(player, 7 + this.AttackModifier * 5, "physical", "melee", angle, 100, Math.PI / 8, 5, this.id, 200);
                    if (this.classType === 0)
                        this.basicAttackTemplate(player, 7 + this.AttackModifier, "poison", "melee", angle, 100, Math.PI / 6, 10, this.id, 300);
                    else if (this.classType === 2)
                        this.basicAttackTemplate(player, 15 + this.AttackModifier * 2, "crushing", "melee", angle, 130, Math.PI / 3, 30, this.id, 900);
                    //if (this.classType === 1) this.basicAttackTemplate(player, 5, "magic", "melee", angle, 200, Math.PI / 8, 50, this, 200);
                }
            });
        }
    }
    public basicAttackTemplate(
        player: Player,
        damage: number,
        damageType: String,
        type: string,
        angle: number,
        range: number,
        spread: number,
        meleeRange: number,
        id: number,
        knockback: number,
        //on hit effect methods?)
    ) {
        //find relative distance
        const xDif = player.position.x - this.position.x;
        const yDif = player.position.y - this.position.y;
        const distance = Math.sqrt(Math.pow(xDif, 2) + Math.pow(yDif, 2));

        //find relative angle
        let newX: number = player.position.x + player.size.width / 2 - (this.position.x + this.size.width / 2);
        let newY: number = player.position.y + player.size.height / 2 - (this.position.y + this.size.height / 2);
        let enemyAngle: number = Math.atan(newY / newX);
        if (newX < 0) enemyAngle += Math.PI;

        if (distance < range) {
            if (
                (enemyAngle > angle - spread / 2 && enemyAngle < angle + spread / 2) ||
                (enemyAngle > angle - spread / 2 + Math.PI * 2 && enemyAngle < angle + spread / 2 + Math.PI * 2) ||
                (enemyAngle > angle - spread / 2 - Math.PI * 2 && enemyAngle < angle + spread / 2 - Math.PI * 2) ||
                distance < meleeRange
            ) {
                if (this.classType === 0) {
                    if (!player.isShielded && !player.isDead) player.dotPlayer(2 + this.AttackModifier / 4, this.id, "poison", "elemental", 250, 6);
                    if (
                        (player.facing && angle >= Math.PI / -2 && angle <= Math.PI / 2) ||
                        (!player.facing && angle >= Math.PI / 2 && angle <= (Math.PI * 3) / 2)
                    ) {
                        if (this.isStealthed) damage *= 2;
                        else damage *= 1.3;
                    }
                }

                player.damagePlayer(damage, id, type, damageType);
                player.knockbackPlayer(angle, knockback);

                this.revealStealthed(20);
            }
        }

        return;
    }
    public wizardBasicAttack() {
        let newX: number = this.focusPosition.x - this.position.x - this.size.width / 2;
        let newY: number = this.focusPosition.y - this.position.y - this.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        this.doProjectile(
            "fire",
            "fire",
            12 + this.AttackModifier * 2,
            this.id,
            this.id,
            { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            { x: 1200 * Math.cos(angle), y: 1200 * Math.sin(angle) },
            0,
            0,
            0,
            0.6,
            false,
        );

        this.moveSpeedModifier /= 1.2;
        setTimeout(() => {
            this.moveSpeedModifier *= 1.2;
        }, 500);
    }

    public attemptSecondaryAttack(players: Player[]) {
        if (!this.isDead) this.secondaryAttack(players);
    }
    public secondaryAttack(players: Player[]) {
        if (this.classType === 0) this.ninjaSecondaryAttack();
        if (this.classType === 1) this.wizardSecondaryAttack();
        if (this.classType === 2) this.knightSecondaryAttack(players);
    }
    public ninjaSecondaryAttack() {
        let newX: number = this.focusPosition.x - this.position.x - this.size.width / 2;
        let newY: number = this.focusPosition.y - this.position.y - this.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        this.momentum.x += this.momentum.x / 2 - 1000 * Math.cos(angle);
        this.momentum.y += this.momentum.y / 2 - 1000 * Math.sin(angle);

        this.doProjectile(
            "shuriken",
            "poison",
            5,
            this.id,
            this.id,
            { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            { x: 2500 * Math.cos(angle), y: 2500 * Math.sin(angle) },
            0.05,
            100,
            0,
            1,
            false,
        );
    }
    public wizardSecondaryAttack() {
        let newX: number = this.focusPosition.x - this.position.x - this.size.width / 2;
        let newY: number = this.focusPosition.y - this.position.y - this.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        this.doProjectile(
            "ice",
            "ranged",
            15,
            this.id,
            this.id,
            { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            { x: 1300 * Math.cos(angle), y: 1300 * Math.sin(angle) - 100 },
            0.15,
            1000,
            0,
            1,
            false,
        );

        this.moveSpeedModifier /= 1.5;
        setTimeout(() => {
            this.moveSpeedModifier *= 1.5;
        }, 500);
    }
    public knightSecondaryAttack(players: Player[]) {
        let momentum: number = 3000;
        let knockbackMomentum: number = 2000;
        let range: number = 250;
        let damage: number = 5;

        if (!this.facing) {
            momentum *= -1;
            knockbackMomentum *= -1;
        }

        this.momentum.x += momentum;
        setTimeout(() => {
            this.momentum.x /= 2;
        }, 100);

        players.forEach((player) => {
            if (player != this && player.position.y > this.position.y - 50 && player.position.y < this.position.y + 50) {
                if (this.facing && player.position.x > this.position.x - 25 && player.position.x < this.position.x + range) {
                    setTimeout(() => {
                        player.damagePlayer(damage, this.id, "crushing", "melee");
                        player.knockbackPlayer(0, knockbackMomentum);
                        player.momentum.y -= 500; // knocks them slightly upwards

                        player.moveSpeedModifier /= 5; // slows them by 80%
                        setTimeout(() => {
                            player.moveSpeedModifier *= 5;
                        }, 800);
                    }, 30);
                } else if (!this.facing && player.position.x > this.position.x - range && player.position.x < this.position.x + 25) {
                    setTimeout(() => {
                        player.damagePlayer(damage, this.id, "crushing", "melee");
                        player.knockbackPlayer(0, knockbackMomentum);
                        player.momentum.y -= 500; // knocks them slightly upwards

                        player.moveSpeedModifier /= 5; // slows them by 80%
                        setTimeout(() => {
                            player.moveSpeedModifier *= 5;
                        }, 800);
                    }, 30);
                }
            }
        });
    }

    public attemptfirstAbility(players: Player[], platforms: Platform[]) {
        this.firstAbility(players, platforms);
    }
    public firstAbility(players: Player[], platforms: Platform[]) {
        if (this.classType === 0) this.ninjaFirstAbility();
        if (this.classType === 1) this.wizardFirstAbility(platforms);
        if (this.classType === 2) this.knightFirstAbility();
    }

    public wizardFirstAbility(platforms: Platform[]) {
        let y = this.config.ySize;

        platforms.forEach((platform) => {
            if (
                platform.position.x < this.focusPosition.x - 4 &&
                platform.position.x + platform.size.width > this.focusPosition.x - 4 &&
                platform.position.y > this.focusPosition.y - 4
            ) {
                y = platform.position.y;
            }
        });

        this.doTargetedProjectile(
            "firestrike",
            this.id,
            this.id,
            { x: this.focusPosition.x - 4, y: y - this.config.ySize },
            { x: 0, y: 600 },
            { x: this.focusPosition.x - 4, y: y },
            false,
            40,
        );
    }

    public knightFirstAbility() {
        let newX: number = this.focusPosition.x - this.position.x - this.size.width / 2;
        let newY: number = this.focusPosition.y - this.position.y - this.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        this.doTargetedProjectile(
            "chains",
            this.id,
            this.id,
            { x: this.position.x + Math.cos(angle) * 500, y: this.position.y + Math.sin(angle) * 500 },
            { x: 0, y: 0 },
            this.position,
            //{x: this.position.x, y: this.position.y},
            false,
            1,
        );
    }

    public ninjaFirstAbility() {
        this.isStealthed = true;
        this.stealthCount = setTimeout(() => {
            this.isStealthed = false;
        }, 6500);
    }

    public revealStealthed(time: number = 1) {
        this.stealthCount = setTimeout(() => {
            this.isStealthed = false;
        }, time);
    }

    public wasHit() {
        this.isHit = true;
        setTimeout(() => {
            this.isHit = false;
        }, 55);
    }

    public healPlayer(quantity: number) {
        this.health += quantity;
        if (this.health > 100 + this.healthModifier) {
            this.health = 100 + this.healthModifier;
        }
    }

    public dotPlayer(quantity: number, id: number, type: String, damageType: String, spacing: number, amount: number) {
        if (amount === 0 || this.isDead) return;
        setTimeout(() => {
            this.damagePlayer(quantity, id, type, damageType, false);
            this.dotPlayer(quantity, id, type, damageType, spacing, amount - 1);
        }, spacing);
    }

    public damagePlayer(quantity: number, id: number, type: String, damageType: String, ifStrong: boolean = true): boolean {
        if (this.isShielded) {
            if (type != "unblockable") return false;
        } else if (this.isDead) {
            return false;
        }

        if (id != this.id) this.lastHitBy = id;
        this.health -= quantity;
        if (ifStrong) {
            this.revealStealthed();
            this.wasHit();
        }

        if (this.health <= 0) {
            this.die();
            this.health = 0;
            return true;
        }
        return false;
    }

    public knockbackPlayer(angle: number, force: number) {
        if (force === 0) return;
        this.momentum.x = this.momentum.x / 2 + force * Math.cos(angle);
        this.momentum.y = this.momentum.y / 2 + force * Math.sin(angle);
    }

    public movePlayer(x: number, y: number, cancelMomentum: boolean = false) {
        this.position.x += x;
        this.position.y += y;
        if (cancelMomentum) {
            this.momentum.x = 0;
            this.momentum.y = 0;
        }
    }

    public die() {
        this.revealStealthed();
        console.log(this.id + " was killed by " + this.lastHitBy);
        //this.lastHitBy = this.id;
        this.isDead = true;
    }

    public resurrect() {
        this.isDead = false;
        this.position.x = this.config.playerStart.x + Math.random() * ((this.config.xSize * 3) / 8 - this.config.playerSize);
        this.position.y = this.config.playerStart.y;
        this.deathCooldown = 150;
        this.health = 100 + this.healthModifier;
        this.momentum.x = 0;
        this.momentum.y = 0;
        this.lastHitBy = this.id;

        this.isShielded = true;
        this.shieldCount = setTimeout(() => {
            this.isShielded = false;
        }, 3000);
    }

    private getAKill() {
        this.killCount++;
        while (Math.floor(this.killCount / 2) > this.level) {
            this.levelUp();
        }
    }

    protected levelUp() {
        const rand: number = Math.floor(Math.random() * 3);
        switch (rand) {
            case 0:
                this.AttackModifier += 1;
                break;
            case 1:
                this.healthModifier += 5;
                break;
            case 2:
                this.moveSpeedModifier *= 1.03;
                break;
        }
        this.healPlayer(100 + this.healthModifier);
        this.level++;
        console.log(this.id + " is level " + this.level + "!");
    }

    public update(elapsedTime: number, players: Player[], platforms: Platform[]) {

        //if (this.name != "Nate" && this.classType >= 0) return; // for debugging...

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
        if (this.actionsNextFrame.basicAttack) {
            this.attemptBasicAttack(players);
        }
        if (this.actionsNextFrame.secondaryAttack) {
            this.attemptSecondaryAttack(players);
        }
        if (this.actionsNextFrame.firstAbility) {
            this.attemptfirstAbility(players, platforms);
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

        if (!this.isDead && this.focusPosition.x - this.position.x - this.size.width / 2 > 0) this.facing = true;
        else if (!this.isDead) this.facing = false;

        // Update position based on momentum
        this.position.x += this.momentum.x * elapsedTime * 1.1;
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
        if (!this.isDead && this.position.y >= this.config.ySize - this.size.height) {
            this.damagePlayer(elapsedTime * 120, this.id, "unblockable", "lava");
        } else if (!this.isDead) {
            this.healPlayer(elapsedTime * 1);
        }

        // Respawn timer
        if (this.isDead) {
            if (this.lastHitBy != this.id && this.lastHitBy != -1) {
                players.forEach((player) => {
                    if (player.id === this.lastHitBy) {
                        player.getAKill();
                        console.log(player.id + " has " + player.killCount + " kills");
                    }
                });
                this.lastHitBy = this.id;
            }
            this.deathCooldown -= elapsedTime * 60;
            if (this.deathCooldown <= 0 && this.classType >= 0) {
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
