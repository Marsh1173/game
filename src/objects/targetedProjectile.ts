import { Config } from "../config";
import { SerializedTargetedProjectile } from "../serialized/targetedProjectile";
import { Vector } from "../vector";
import { Size } from "../size";
import { Player } from "./player";
import { Platform } from "./platform";
import { Game } from "../client/game";
import { Projectile } from "./projectile";

export type TargetedProjectileType = "firestrike" | "chains" | "healingAura" | "blizzard";

export abstract class TargetedProjectile {

    constructor(public readonly config: Config,
        public targetedProjectileType: TargetedProjectileType,
        public id: number,
        public team: number,
        public position: Vector,
        public momentum: Vector,
        public destination: Vector,
        public isDead: boolean,
        public life: number,
        ) {}

    public serialize(): SerializedTargetedProjectile {
        return {
            targetedProjectileType: this.targetedProjectileType,
            id: this.id,
            team: this.team,
            position: this.position,
            momentum: this.momentum,
            destination: this.destination,
            isDead: this.isDead,
            life: this.life,
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
            if(this.targetedProjectileType === "blizzard") {
                this.momentum.x *= -1;
                this.position.x += this.momentum.x * elapsedTime;
            }
        }
    }

    public checkCollisionWithPlayer(player: Player, elapsedTime: number): boolean {
        return false;
    }

    public checkSideCollision(elapsedTime: number) {
    }

    public update(elapsedTime: number, players: Player[], platforms: Platform[], projectiles: Projectile[]) {

        if (this.isDead) return;
        if (this.life <= 0) this.isDead = true;
        this.life -= elapsedTime;

        if(this.targetedProjectileType === "firestrike") this.updateFirestrike(elapsedTime, players);
        else if(this.targetedProjectileType === "chains") this.updateChains(elapsedTime, players);
        else if(this.targetedProjectileType === "healingAura") this.updateHealingAura(elapsedTime, players);
        else if(this.targetedProjectileType === "blizzard") this.updateBlizzard(elapsedTime, players, platforms, projectiles);

    }

    private updateFirestrike(elapsedTime: number, players: Player[]) {

        this.momentum.y += 20;
        this.position.y += this.momentum.y * elapsedTime;

        players.forEach(player=> {
            if (!player.isDead && player.id != this.id && player.team != this.team) {
                let distance = Math.sqrt(Math.pow((player.position.x + (player.size.width / 2)) - this.position.x, 2) + Math.pow((player.position.y + (player.size.height / 2)) - this.position.y, 2));
                if (distance < 70) {
                    player.damagePlayer(2, this.id, this.team, "magic");
                    player.momentum.y += 200;
                }
            }
        });

        if (this.position.y > this.destination.y - 40) this.firestrikeExplode(players);
    }

    public firestrikeExplode(players: Player[]) {
        players.forEach(player=> {
            let distance = Math.sqrt(Math.pow((player.position.x + (player.size.width / 2)) - this.position.x, 2) + Math.pow((player.position.y + (player.size.height / 2)) - this.position.y, 2));
            if (this.team != player.team && this.id != player.id && !player.isDead && distance < 100) {

                player.damagePlayer(40, this.id, this.team, "magic");

                let newX: number = (player.position.x + player.size.width / 2 - this.position.x);
                let newY: number = (player.position.y + player.size.height / 2 - this.position.y);
                let angle: number = Math.atan(newY / newX);
                if(newX < 0) angle += Math.PI;
                player.knockbackPlayer(angle, 2000);

            }
        });

        this.life = 0;
        this.isDead = true;
    }

    private updateChains(elapsedTime: number, players: Player[]) {
        this.momentum.x = ((this.destination.x + this.config.playerSize.x / 2) - this.position.x) / 2 + (this.momentum.x * 0.87);
        this.momentum.y = ((this.destination.y + this.config.playerSize.y / 2) - this.position.y) / 2 + (this.momentum.y * 0.87);

        players.forEach(player => {
            let distance = Math.sqrt(Math.pow((player.position.x + (player.size.width / 2)) - this.position.x, 2) + Math.pow((player.position.y + (player.size.height / 2)) - this.position.y, 2));
            if (this.team != player.team && this.id != player.id && distance < 100) {
                player.momentum.x += this.momentum.x / 2;
                player.momentum.y += this.momentum.y / 2;
                if (!player.isDead) player.lastHitBy = this.id;
            }
        });

        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;

        let distance = Math.sqrt(Math.pow((this.destination.x + (this.config.playerSize.x / 2)) - this.position.x, 2) + Math.pow((this.destination.y + (this.config.playerSize.y / 2)) - this.position.y, 2));
        if (distance < 70) {
            this.isDead = true;
        }
    }

    private updateHealingAura(elapsedTime: number, players: Player[]) {
        players.forEach(player => {
            let distance = Math.sqrt(Math.pow((player.position.x + (player.size.width / 2)) - this.position.x, 2) + Math.pow((player.position.y + (player.size.height / 2)) - this.position.y, 2));
            if (this.team === player.team && distance < 160) {
                if (!player.isDead) player.healPlayer(0.5);
            }
        });

        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;
    }

    private updateGravity(elapsedTime: number, players: Player[]) {
        this.momentum.x = ((this.destination.x + this.config.playerSize.x / 2) - this.position.x) / 2 + (this.momentum.x * 0.99);
        this.momentum.y = ((this.destination.y + this.config.playerSize.y / 2) - this.position.y) / 2 + (this.momentum.y * 0.99);

        players.forEach(player => {
            let distance = Math.sqrt(Math.pow((player.position.x + (player.size.width / 2)) - this.position.x, 2) + Math.pow((player.position.y + (player.size.height / 2)) - this.position.y, 2));
            if (this.id != player.id && distance < 70) {
                player.momentum.x = this.momentum.x + player.momentum.x / 10;
                player.momentum.y = this.momentum.y + player.momentum.x / 10;
            }
        });

        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;

        let distance = Math.sqrt(Math.pow((this.destination.x + (this.config.playerSize.x / 2)) - this.position.x, 2) + Math.pow((this.destination.y + (this.config.playerSize.y / 2)) - this.position.y, 2));
        if (distance < 90) {
            //this.isDead = true;
        }
    }

    private updateBlizzard(elapsedTime: number, players: Player[], platforms: Platform[], projectiles: Projectile[]) {

        platforms.forEach((platform) => {
            this.checkCollisionWithRectangularObject(platform, elapsedTime);
        });

        players.forEach((player) => {
            if (Math.abs(player.position.x - this.position.x) < 180 && Math.abs(player.position.y - this.position.y) < 100 && player.team != this.team) {
                player.isFrozen *= 0.9;
                setTimeout(() => {
                    player.isFrozen /= 0.9;
                }, 100);
            }
        });
        projectiles.forEach((projectile) => {
            if (Math.abs(projectile.position.x - this.position.x) < 180 && Math.abs(projectile.position.y - this.position.y) < 100) {// && player.team === this.team) {
                projectile.isFrozen *= 0.8;
                setTimeout(() => {
                    projectile.isFrozen /= 0.8;
                }, 100);
            }
        });

        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;

        if (Math.abs(this.destination.x - this.position.x) < 50) {
            //this.isDead = true;
        }

    }
    
}
