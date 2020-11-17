import { Config } from "../config";
import { SerializedBasicAttack } from "../serialized/basicAttack";
import { Vector } from "../vector";
import { Player } from "./player";

export abstract class BasicAttack {
    constructor(
        private readonly config: Config,
        public readonly position: Vector,
        public angle: number, // angle is the angle in radians that the player excecuted the attack at
        public id: number, // contains the player id
        public damage: number, // contains the amount of damage dealt by the attack
        public range: number, // the distance from the player to where he performs the attack
        public life: number, // contains an integer (set to one) of the lifespan of the animation
        public spread: number, // size of area of effect
    ) {}

    public serialize(): SerializedBasicAttack {
        return {
            position: this.position,
            angle: this.angle,
            id: this.id,
            damage: this.damage,
            range: this.range,
            life: this.life,
            spread: this.spread,
        };
    }

    public update(elapsedTime: number) {
        this.life -= elapsedTime * 7;
    }

    public basicAttackPlayer(player: Player) {
        const x1 = this.position.x + Math.cos(this.angle) * this.range;
        const y1 = this.position.y + Math.sin(this.angle) * this.range;

        const x2 = player.position.x + player.size.width / 2;
        const y2 = player.position.y + player.size.height / 2;
        const distanceVector = {
            x: x1 - x2,
            y: y1 - y2,
        };
        const distancefromPlayerVector = {
            x: this.position.x - x2,
            y: this.position.y - y2,
        };

        const distance = Math.sqrt(Math.pow(distanceVector.x, 2) + Math.pow(distanceVector.y, 2));
        const distanceFromPlayer = Math.sqrt(Math.pow(distancefromPlayerVector.x, 2) + Math.pow(distancefromPlayerVector.y, 2));

        if (distance < this.spread && distanceFromPlayer < this.range * 1.3 && this.id !== player.id) {
            player.momentum.x += (Math.cos(this.angle) * this.config.blastPower / 1) / Math.pow(distanceFromPlayer, 1.6);
            player.momentum.y += (Math.sin(this.angle) * this.config.blastPower / 1) / Math.pow(distanceFromPlayer, 1.5);
            if (!player.isDead && !player.isShielded) {
                player.damagePlayer(this.damage, this.id);
            }
        }
    }

}
