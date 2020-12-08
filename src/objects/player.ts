import { Config } from "../config";
import { SerializedPlayer } from "../serialized/player";
import { Size } from "../size";
import { Vector } from "../vector";
import { ProjectileType } from "./projectile";
import { TargetedProjectileType } from "./targetedProjectile";
import { Platform } from "./platform";
import { ClassType, isPlayerClassType } from "../classtype";
import { Weapon, WeaponBasicAttack } from "../weapon";
import { getRandomWeapon, Item, ItemType } from "./item";

export type PlayerActions = "jump" | "moveLeft" | "moveRight" | "basicAttack" | "secondaryAttack" | "firstAbility" | "secondAbility";
export type DamageType = "unblockable" | "melee" | "magic" | "ranged" | "crushing";

export class effectsClass {
    isShielded: boolean;
    isStealthed: boolean;
    isSlowed: number;

    constructor(isShielded: boolean,
        isStealthed: boolean,
        isSlowed: number,) {
            this.isShielded = isShielded;
            this.isStealthed = isStealthed;
            this.isSlowed = isSlowed;
        }
}

export abstract class Player {
    private static nextId = 0;
    public static getNextId() {
        return Player.nextId++;
    }

    public shieldCount = setTimeout(() => "", 1);
    public stealthCount = setTimeout(() => "", 1);

    public AttackModifier: number = 0;

    public XP: number;
    public XPuntilNextLevel: number;

    public readonly actionsNextFrame: Record<PlayerActions, boolean> = {
        jump: false,
        moveLeft: false,
        moveRight: false,
        basicAttack: false,
        secondaryAttack: false,
        firstAbility: false,
        secondAbility: false,
    };

    constructor(
        public readonly config: Config,
        public id: number,
        public team: number,
        public name: string,
        public classType: ClassType,
        public weaponEquipped: Weapon, //NOT BEING USED ATM
        public animationFrame: number,
        public position: Vector,
        public momentum: Vector,
        public color: string,
        public size: Size,
        public blastCounter: number,
        public alreadyJumped: number,
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
        public effects: effectsClass,
        public facing: boolean, // true if facing right, false for left
        public moveSpeedModifier: number, // multiplied by their movespeed and jump height.
        public healthModifier: number,
        public level: number,
        //public damageMitigation: number, // divides the damage taken
        public doProjectile: (
            projectileType: ProjectileType,
            damageType: DamageType,
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
        public doItem: (
            itemType: ItemType,
            position: Vector,
            momentum: Vector,
            life: number,
        ) => void,
    ) {
        if (this.classType === "ninja") this.moveSpeedModifier *= 1.1;
        else if (this.classType === "axeai" || this.classType === "archerai") this.moveSpeedModifier *= 0.9;

        this.XP = 0;
        this.XPuntilNextLevel = 50;
    }

    public serialize(): SerializedPlayer {
        return {
            id: this.id,
            team: this.team,
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
            effects: this.effects,
            facing: this.facing,
            moveSpeedModifier: this.moveSpeedModifier,
            healthModifier: this.healthModifier,
            level: this.level,
            //damageMitigation: this.damageMitigation,
        };
    }

    private checkCollisionWithRectangularObject(object: { size: Size; position: Vector }, elapsedTime: number) {
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

    private checkCollisionWithPlayer(object: { size: Size; position: Vector }, elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (
            futurePosX < object.position.x + object.size.width &&
            futurePosX + this.size.width > object.position.x &&
            futurePosY < object.position.y + object.size.height &&
            futurePosY + this.size.height > object.position.y
        ) {
            const xDistance: number = (object.position.x - this.position.x);
            if (xDistance > 0) this.momentum.x -= 40;
            else this.momentum.x += 40;
        }
    }

    /*public checkPlatformShadows(platforms: Platform[], object: { size: Size; position: Vector }, elapsedTime: number) {
        platforms.forEach((platform) => {
            if (this.position.x + this.size.width / 2 > platform.position.x) {
                platform.cornerPoints[3][1] = true;
            } else platform.cornerPoints[3][1] = false;
            if (this.position.x + this.size.width / 2 < platform.position.x + platform.size.width) {
                platform.cornerPoints[1][1] = true;
            } else platform.cornerPoints[1][1] = false;
            if (this.position.y + this.size.height / 2 > platform.position.y) {
                platform.cornerPoints[0][1] = true;
            } else platform.cornerPoints[0][1] = false;
            if (this.position.y + this.size.height / 2 < platform.position.y + platform.size.height) {
                platform.cornerPoints[2][1] = true;
            } else platform.cornerPoints[2][1] = false;
        });
    }*/

    public checkLineOfSightFromPlayer(platforms: Platform[], targetx: number, targety: number): boolean { // we will check if the player's focus can be seen from his position
        let test: boolean = true;
        platforms.forEach(platform => { // checks each platform
            for (let i: number = 0; i < 4; i++) {
                if (this.intersects(targetx, targety, this.position.x + this.size.width/2, this.position.y + this.size.height/2,
                    platform.cornerPoints[i].x, platform.cornerPoints[i].y, platform.cornerPoints[(i + 1) % 4].x, platform.cornerPoints[(i + 1) % 4].y)) {
                        test = false;
                    }
            }
        });
        return test;
    }

    public intersects(a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number): boolean {
        //checks if line (a, b) -> (c, d) intersects with line (p, q) -> (r, s)
        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    };

    public attemptJump() {

    }
    public jump() {
        if (this.isDead || this.alreadyJumped > 1) return;
        this.momentum.y = -this.config.playerJumpHeight * (this.moveSpeedModifier + 1) / 2;
        this.alreadyJumped++;
    }
    public attemptMoveLeft(elapsedTime: number) {
    
    }
    public moveLeft(elapsedTime: number) {
        if (this.isDead || this.momentum.x <= -this.config.maxSidewaysMomentum) return;
        if (this.standing) {
            this.momentum.x -= this.config.standingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
        } else {
            this.momentum.x -= this.config.nonStandingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
        }
    }
    public attemptMoveRight(elapsedTime: number) {

    }
    public moveRight(elapsedTime: number) {
        if (this.isDead || this.momentum.x >= this.config.maxSidewaysMomentum) return;
        if (this.standing) {
            this.momentum.x += this.config.standingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
        } else {
            this.momentum.x += this.config.nonStandingSidewaysAcceleration * elapsedTime * this.moveSpeedModifier;
        }
    }

    public attemptBasicAttack(players: Player[], items: Item[]) {

    }
    public basicAttack(players: Player[], items: Item[]) {
        if (!this.isDead) WeaponBasicAttack[this.weaponEquipped](this, players, this.doProjectile);
    }

    public attemptSecondaryAttack(players: Player[], platforms: Platform[]) {
    }
    public secondaryAttack(players: Player[], platforms: Platform[]) {
        if (this.isDead) return;
        else if (this.classType === "ninja") this.ninjaSecondaryAttack();
        else if (this.classType === "wizard") this.wizardSecondaryAttack(platforms);
        else if (this.classType === "warrior") this.warriorSecondaryAttack(players);
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
            "ranged",
            7,
            this.id,
            this.team,
            { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            { x: 2500 * Math.cos(angle), y: 2500 * Math.sin(angle) },
            0.05,
            100,
            0,
            1,
            false,
        );
    }
    public wizardSecondaryAttack(platforms: Platform[]) {

        this.doTargetedProjectile(
            "blizzard",
            this.id,
            this.team,
            { x: this.position.x + this.size.width / 2, y: this.position.y},
            { x: (this.facing) ? 75 : -75, y: 0 },
            {x: 0, y: 0},
            //{ x: this.focusPosition.x + ((this.facing) ? 800 : -800), y: y },
            false,
            6,
        );

        /*let newX: number = this.focusPosition.x - this.position.x - this.size.width / 2;
        let newY: number = this.focusPosition.y - this.position.y - this.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        this.doProjectile(
            "ice",
            "ranged",
            15,
            this.id,
            this.team,
            { x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2 },
            { x: 1300 * Math.cos(angle), y: 1300 * Math.sin(angle) - 100 },
            0.15,
            1000,
            0,
            1,
            false,
        );

        this.moveSpeedModifier /= 2;
        setTimeout(() => {
            this.moveSpeedModifier *= 2;
        }, 200);*/
    }
    public warriorSecondaryAttack(players: Player[]) {
        const xRange: number = 400;
        const yRange: number = 50;

        this.momentum.x = 0;
        this.momentum.y /= 3;
        if (this.facing) this.pushPlayer(2, 0, 170);
        else this.pushPlayer(-2, 0, 170);

        players.forEach((player) => {
            if (player.team != this.team &&
                player.position.y > this.position.y - yRange && player.position.y < this.position.y + yRange &&
                ((this.facing && player.position.x > this.position.x - 25 && player.position.x < this.position.x + xRange) ||
                (!this.facing && player.position.x > this.position.x - xRange && player.position.x < this.position.x + 25))) {
                    setTimeout(() => {
                        player.damagePlayer(7, this.id, this.team, "crushing");
                        player.momentum.y -= 400; // knocks them slightly upwards

                        player.moveSpeedModifier /= 2; // slows them by half
                        setTimeout(() => {
                            player.moveSpeedModifier *= 2;
                        }, 1500);
                    }, 30);
            }
        });
    }

    public attemptFirstAbility(players: Player[], platforms: Platform[]) {
    }
    public firstAbility(players: Player[], platforms: Platform[]) {
        if (this.isDead) return;
        else if (this.classType === "ninja") this.ninjaFirstAbility();
        else if (this.classType === "wizard") this.wizardFirstAbility(platforms);
        else if (this.classType === "warrior") this.warriorFirstAbility();
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
            this.team,
            { x: this.focusPosition.x - 4, y: y - this.config.ySize },
            { x: 0, y: 600 },
            { x: this.focusPosition.x - 4, y: y },
            false,
            40,
        );
    }

    public warriorFirstAbility() {
        let newX: number = this.focusPosition.x - this.position.x - this.size.width / 2;
        let newY: number = this.focusPosition.y - this.position.y - this.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        this.doTargetedProjectile(
            "chains",
            this.id,
            this.team,
            { x: this.position.x + Math.cos(angle) * 500, y: this.position.y + Math.sin(angle) * 500 },
            { x: 0, y: 0 },
            this.position,
            false,
            1,
        );
        /*this.doTargetedProjectile(
            "healingAura",
            this.id,
            this.team,
            {x: this.position.x + this.size.width / 2, y: this.position.y + this.size.height / 2},
            { x: Math.cos(angle) * 50, y: Math.sin(angle) * 50 },
            { x: this.position.x + Math.cos(angle) * 500, y: this.position.y + Math.sin(angle) * 500 },
            //{x: this.position.x, y: this.position.y},
            false,
            3,
        );*/
    }

    public ninjaFirstAbility() {
        this.effects.isStealthed = true;
        this.stealthCount = setTimeout(() => {
            this.effects.isStealthed = false;
        }, 6500);
    }

    public attemptSecondAbility(players: Player[], platforms: Platform[]) {
    }

    public secondAbility(players: Player[], platforms: Platform[]) {
        if (this.isDead) return;
    }

    public attemptThirdAbility(players: Player[], platforms: Platform[]) {
    }

    public thirdAbility(players: Player[], platforms: Platform[]) {
        if (this.isDead) return;
    }

    public revealStealthed(time: number = 1) {
        this.stealthCount = setTimeout(() => {
            this.effects.isStealthed = false;
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

    public dotPlayer(quantity: number, id: number, team: number, damageType: DamageType, spacing: number, amount: number) {
        if (amount === 0 || this.isDead) return;
        setTimeout(() => {
            this.damagePlayer(quantity, id, team, damageType, false);
            this.dotPlayer(quantity, id, team, damageType, spacing, amount - 1);
        }, spacing);
    }

    public damagePlayer(quantity: number, id: number, team: number, damageType: DamageType, ifStrong: boolean = true): boolean {
        if (this.isDead || this.team === team) {
            return false;
        }
        if (this.effects.isShielded) {
            if (damageType != "unblockable") return false;
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

    public teleportPlayer(x: number, y: number, cancelMomentum: boolean = false) {
        this.position.x += x;
        this.position.y += y;
        if (cancelMomentum) {
            this.momentum.x = 0;
            this.momentum.y = 0;
        }
    }

    public pushPlayer(x: number, y: number, amount: number) {
        if (this.isDead || amount <= 0) return;
        this.position.x += x;
        this.position.y += y;
        this.momentum.x += x;
        this.momentum.y += y;

        setTimeout(() => {
            this.pushPlayer(x, y, amount - 1);
        }, 1);
    }

    public die() {

        this.revealStealthed();
        console.log(this.id + " was killed by " + this.lastHitBy);
        //this.lastHitBy = this.id;
        this.isDead = true;
    }

    public resurrect() {
        this.isDead = false;
        this.position.x = (this.team === 1) ? this.config.playerStart.x : this.config.playerStart.x + 3300;
        this.position.y = this.config.playerStart.y;
        this.deathCooldown = 150;
        this.health = 100 + this.healthModifier;
        this.momentum.x = 0;
        this.momentum.y = 0;
        this.lastHitBy = this.id;

        this.effects.isShielded = true;
        this.shieldCount = setTimeout(() => {
            this.effects.isShielded = false;
        }, 3000);
    }

    private getAKill(player: Player) {
        this.killCount++;
        this.giveXP((player.level + 1) * 5 + 20);
    }

    private giveXP(quantity: number) {
        this.XP += quantity;
        if (this.XP >= this.XPuntilNextLevel) {
            this.XP -= this.XPuntilNextLevel;
            this.XPuntilNextLevel += 10;
            this.levelUp();
            this.giveXP(0);
        }
    }

    protected levelUp() {
        const rand: number = Math.floor(Math.random() * 3);
        switch (rand) {
            case 0:
                this.AttackModifier += 1;
                break;
            case 1:
                this.healthModifier += 10;
                break;
            case 2:
                this.moveSpeedModifier += 0.05;
                break;
        }
        this.healPlayer((100 + this.healthModifier - this.health) / 2);
        this.level++;
        console.log(this.id + " is level " + this.level + "!");
    }

    private updateAnimationFrame(elapsedTime: number) {

        /* each animation is a fourth of a second long.
            odd numbers are the start of an animation that runs until it hits an even number, which resets it to 0
            for example, to animate an attack, set the animationFrame to 1, where it will run until it hits 2, where it'll be reset to 0.
            the player's weapon will read the animationFrame in clientWeapon.ts and move accordingly.
        */

        if (this.animationFrame === 0) { 
            return;
        } else if (Math.floor(this.animationFrame % 2) === 0) { 
            this.animationFrame = 0;
        } else { 
            this.animationFrame += elapsedTime * 4;
        }

    }

    public update(elapsedTime: number, players: Player[], platforms: Platform[], items: Item[]) {

        if (this.isDead) { // if they're dead, update a few things then return

            this.momentum.x = 0;
            this.momentum.y = 0;

            if (this.lastHitBy != this.id && this.lastHitBy != -1) {
                players.forEach((player) => {
                    if (player.id === this.lastHitBy) {
                        player.getAKill(this);
                        console.log(player.id + " has " + player.killCount + " kills");
                    }
                });
                this.lastHitBy = this.id;
            }
            this.deathCooldown -= elapsedTime * 60;
            if (this.deathCooldown <= 0 && isPlayerClassType(this.classType)) {
                this.resurrect();
            }
            return;
        }
        
        // Falling speed
        if (!this.standing) {
            this.momentum.y += this.config.fallingAcceleration * elapsedTime;
        }

        // Action handling
        if (this.actionsNextFrame.jump) {
            this.attemptJump();
        }
        if (this.actionsNextFrame.moveLeft) {
            this.attemptMoveLeft(elapsedTime);
        }
        if (this.actionsNextFrame.moveRight) {
            this.attemptMoveRight(elapsedTime);
        } else {
        }
        if (this.actionsNextFrame.basicAttack) {
            this.attemptBasicAttack(players, items);
        }
        if (this.actionsNextFrame.secondaryAttack) {
            this.attemptSecondaryAttack(players, platforms);
        }
        if (this.actionsNextFrame.firstAbility) {
            this.attemptFirstAbility(players, platforms);
        }
        if (this.actionsNextFrame.secondAbility) {
            this.attemptSecondAbility(players, platforms);
        }
        
        this.updateAnimationFrame(elapsedTime); //updates the player's animation frame

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
            this.alreadyJumped = 0;
            this.wasStanding = true;
            this.standing = false;
        } else {
            this.wasStanding = false;
            if (this.alreadyJumped === 0) this.alreadyJumped = 1;
        }

        this.facing = (this.focusPosition.x - this.position.x - this.size.width / 2 > 0) ? true : false; // checks which side the player's focusing at

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

        // get damaged if you hit the bottom of the screen
        if (!this.isDead && this.position.y >= this.config.ySize - this.size.height) {
            this.damagePlayer(elapsedTime * 120, this.id, -this.team - 1, "unblockable");
        } else if (!this.isDead) {
            this.healPlayer(elapsedTime * 1);
        }

        platforms.forEach((platform) => {
            this.checkCollisionWithRectangularObject(platform, elapsedTime);
        });
        players.forEach((player2) => {
            if (!player2.isDead &&
                player2.id != this.id &&
                !this.effects.isStealthed && !player2.effects.isStealthed &&
                this.classType != "ninja" && player2.classType != "ninja") this.checkCollisionWithPlayer(player2, elapsedTime);
        });

        Object.keys(this.actionsNextFrame).forEach((key) => (this.actionsNextFrame[key as PlayerActions] = false));
    }
}
