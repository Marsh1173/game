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
import { AbilityCastFunction, AbilityName, AbilityType, getAbilityStats, PlayerAbilities, updateAndCheckAbilites } from "./abilities";

export type PlayerActions = "jump" | "moveLeft" | "moveRight" | "die" | "level" | PlayerAbilities;
export type DamageType = "unblockable" | "melee" | "magic" | "ranged" | "crushing";

export type effectsType = {
    isShielded: boolean,
    isStealthed: boolean,
    isSlowed: number,
}

export type PlayerAbilityType = {
    abilityName: AbilityName;
    isCharging: boolean;
    chargeAmount: number;
    cooldown: number;
    abilityType: AbilityType,
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
        thirdAbility: false,
        die: false,
        level: false,
    };

    public playerAbilities: PlayerAbilityType[] = [];

    constructor(
        public readonly config: Config,
        public id: number,
        public team: number,
        public name: string,
        public classType: ClassType,
        public weaponEquipped: Weapon,
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
        public killCount: number,
        public focusPosition: Vector, // mouse position
        public isCharging: number,
        public isHit: boolean, // quick true/false if they've been hit in the last moment
        public effects: effectsType,
        public abilityNames: AbilityName[],
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
            id: number,
            position: Vector,
            momentum: Vector,
            life: number,
        ) => void,
    ) {

        for (let i = 0; i < abilityNames.length; i++) {
            this.playerAbilities.push({abilityName: abilityNames[i],
            isCharging: false,
            chargeAmount: 0,
            cooldown: 0,
            abilityType: getAbilityStats(abilityNames[i], weaponEquipped)})
        }

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
            abilityNames: this.abilityNames,
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
        if (!this.isDead && this.alreadyJumped <= 1) this.jump();
    }
    public jump() {
        this.momentum.y = -this.config.playerJumpHeight;// * (this.moveSpeedModifier + 1) / 2;
        this.alreadyJumped++;
    }
    public attemptMoveLeft(elapsedTime: number) {
        if (!this.isDead && this.momentum.x > -this.config.maxSidewaysMomentum) this.moveLeft(elapsedTime);
    }
    public moveLeft(elapsedTime: number) {
        if (this.standing) this.momentum.x -= this.config.standingSidewaysAcceleration * elapsedTime;
        else this.momentum.x -= this.config.nonStandingSidewaysAcceleration * elapsedTime;

        if (this.momentum.x < -this.config.maxSidewaysMomentum) this.momentum.x = -this.config.maxSidewaysMomentum;
    }
    public attemptMoveRight(elapsedTime: number) {
        if (!this.isDead && this.momentum.x < this.config.maxSidewaysMomentum) this.moveRight(elapsedTime);
    }
    public moveRight(elapsedTime: number) {
        if (this.standing) this.momentum.x += this.config.standingSidewaysAcceleration * elapsedTime;
        else this.momentum.x += this.config.nonStandingSidewaysAcceleration * elapsedTime;
        
        if (this.momentum.x > this.config.maxSidewaysMomentum) this.momentum.x = this.config.maxSidewaysMomentum;
    }

    public attemptBasicAttack(players: Player[]) {
        if (!this.isDead) this.basicAttack(players);
    }
    public basicAttack(players: Player[]) {
        WeaponBasicAttack[this.weaponEquipped](this, players, this.doProjectile);
        //this.doItem("axe", {x: this.position.x, y: this.position.y}, {x: 0, y: -100}, 10);
    }

    public attemptSecondaryAttack(players: Player[], platforms: Platform[]) {
        if (!this.isDead) this.secondaryAttack(players, platforms);
    }
    public secondaryAttack(players: Player[], platforms: Platform[]) {
        AbilityCastFunction[this.playerAbilities[1].abilityName](this, players, platforms);
    }

    public attemptFirstAbility(players: Player[], platforms: Platform[]) {
        if (!this.isDead) this.firstAbility(players, platforms);
    }
    public firstAbility(players: Player[], platforms: Platform[]) {
        AbilityCastFunction[this.playerAbilities[2].abilityName](this, players, platforms);
    }

    public attemptSecondAbility(players: Player[], platforms: Platform[]) {
        if (!this.isDead) this.secondAbility(players, platforms);
    }

    public secondAbility(players: Player[], platforms: Platform[]) {
        AbilityCastFunction[this.playerAbilities[3].abilityName](this, players, platforms);
    }

    public attemptThirdAbility(players: Player[], platforms: Platform[]) {
        if (!this.isDead) this.thirdAbility(players, platforms);
    }

    public thirdAbility(players: Player[], platforms: Platform[]) {
        AbilityCastFunction[this.playerAbilities[4].abilityName](this, players, platforms);
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
        if (this.isDead) return;
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

    public attemptDie() {

        //playerside, this should only be called if the person's player dies.
        //serverside?

        //this.actionsNextFrame.die = true;
    }

    public die() {
        this.actionsNextFrame.die = false;
        this.health = 0;
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
        this.giveXP((player.level) * 5 + 10);
    }

    private giveXP(quantity: number) {
        this.XP += quantity;
    }

    protected levelUp() {
        this.actionsNextFrame.level = false;
        this.XP -= this.XPuntilNextLevel;
        this.XPuntilNextLevel += 10;

        this.AttackModifier += 1;
        this.healthModifier += 5;
        this.moveSpeedModifier += 0.01;

        this.healPlayer((100 + this.healthModifier - this.health) / 2);
        this.level++;
        this.giveXP(0);// just in case they earn enough XP for two levels
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

    private playerUpdateAndCheckAbilites(elapsedTime: number) {
        updateAndCheckAbilites(elapsedTime, this, this.playerAbilities[0], "basicAttack");
        updateAndCheckAbilites(elapsedTime, this, this.playerAbilities[1], "secondaryAttack");
        updateAndCheckAbilites(elapsedTime, this, this.playerAbilities[2], "firstAbility");
        updateAndCheckAbilites(elapsedTime, this, this.playerAbilities[3], "secondAbility");
        updateAndCheckAbilites(elapsedTime, this, this.playerAbilities[4], "thirdAbility");
    }

    public playerUpdateAbilityStats() { // whenever you change abilities or weapons, this updates all of them
        for (let i = 0; i < this.abilityNames.length; i++) {
            this.playerAbilities[i] = {abilityName: this.abilityNames[i],
                isCharging: false,
                chargeAmount: 0,
                cooldown: 0,
                abilityType: getAbilityStats(this.abilityNames[i], this.weaponEquipped)};
        }
    }

    protected broadcastActions() {
        //PLACEHOLDER, implemented in client player and server player.
    }

    public update(elapsedTime: number, players: Player[], platforms: Platform[], items: Item[], ifIsPlayerWithId: boolean) {

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
            if (this.deathCooldown <= 0) {
                this.resurrect();
            }
            Object.keys(this.actionsNextFrame).forEach((key) => (this.actionsNextFrame[key as PlayerActions] = false));
            return;
        }
        
        // Falling speed
        if (!this.standing) {
            this.momentum.y += this.config.fallingAcceleration * elapsedTime;
        }

        //update and check status
        this.playerUpdateAndCheckAbilites(elapsedTime);
        if (ifIsPlayerWithId) {
            if (this.XP >= this.XPuntilNextLevel) this.actionsNextFrame.level = true;
            if (this.health <= 0) this.actionsNextFrame.die = true;
            this.broadcastActions();
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
        }
        if (this.actionsNextFrame.basicAttack) {
            this.attemptBasicAttack(players);
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
        if (this.actionsNextFrame.thirdAbility) {
            this.attemptThirdAbility(players, platforms);
        }
        if (this.actionsNextFrame.die) {
            this.die();
        }
        if (this.actionsNextFrame.level) {
            this.levelUp();
        }

        this.updateAnimationFrame(elapsedTime); //updates the player's animation frame

        // Movement dampening
        if (Math.abs(this.momentum.x) < 30) {
            this.momentum.x = 0;
        } else if ((this.actionsNextFrame.moveRight === false && this.actionsNextFrame.moveLeft === false) || Math.abs(this.momentum.x) > this.config.maxSidewaysMomentum) {
            if (this.standing || this.wasStanding) {
                this.momentum.x *= 0.65 ** (elapsedTime * 60);
            } else {
                this.momentum.x *= 0.98 ** (elapsedTime * 60);
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
