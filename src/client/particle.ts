import { Distribution } from "../distribution";
import { Platform } from "../objects/platform";
import { Random } from "../random";
import { Size } from "../size";
import { Vector } from "../vector";

export type ParticleType = "smoke" | "fire";
export type ParticleEffectType = "levelUp" | "takeDamage" | "die" | "basicAttack" | "explosion";

class Particle {
    public originalLife: number;
    public static readonly images: Record<ParticleType, HTMLImageElement> = {
        smoke: new Image(),
        fire: new Image(),
    };
    /**
     * @param position the _center_ of where the particle is
     * @param lifetime the lifetime of the particle
     */
    constructor(
        private position: Vector,
        private momentum: Vector,
        private type: ParticleType,
        private size: Size,
        public lifetime: number,
        public rotation: number,
        public rotationMomentum: number,
    ) {
        this.originalLife = this.lifetime;
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
            if (this.momentum.y < 0) {
                this.position.y = object.position.y + object.size.height;
                this.momentum.y *= -1;
            } else {
                this.position.y = object.position.y + this.momentum.y * -elapsedTime;
                this.momentum.y /= -1.5;
            }
        }
    }

    public update(elapsedTime: number, platforms: Platform[]) {
        platforms.forEach((platform) => {
            this.checkCollisionWithRectangularObject(platform, elapsedTime);
        });
        this.momentum.y += elapsedTime * 1200;
        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;
        this.rotation += this.rotationMomentum * elapsedTime;
        this.lifetime -= elapsedTime;
    }

    public render(ctx: CanvasRenderingContext2D) {
        /*ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.translate(-this.position.x, -this.position.y);
        ctx.drawImage(
            Particle.images[this.type],
            this.position.x - this.size.width / 2,
            this.position.y - this.size.height / 2,
            this.size.width,
            this.size.height,
        );
        ctx.restore();*/
        ctx.globalAlpha = (this.lifetime / this.originalLife);
        ctx.shadowBlur = 5;
        ctx.shadowColor = "yellow";
        ctx.fillStyle = "white";
        ctx.fillRect(this.position.x - 2, this.position.y - 2, 4, 4);
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
        ctx.globalAlpha = 1;
    }
}
Object.keys(Particle.images).forEach((imageKey) => {
    Particle.images[imageKey as ParticleType].src = "images/particles/" + imageKey + ".png";
});

interface ParticleEffectInfo {
    particleType: ParticleType;
    position: Vector;
    particleSize: Size;
    particleSpeed: Distribution;
    particleLifetime: Distribution;
    particleAmt: number;
}

/*interface ParticleEffectInfo {
    particleEffectType: ParticleEffectType;
    position: Vector;
    direction: Vector;
    color: string;
}*/

class ParticleEffect {
    public particles: Particle[];
    constructor(private readonly info: ParticleEffectInfo) {
        this.particles = [];
        for (let i = 0; i < this.info.particleAmt; i++) {
            const direction = Random.nextCircleVector();
            const speed = Random.nextGaussian(info.particleSpeed.mean, info.particleSpeed.stdev);
            direction.x *= speed;
            direction.y *= speed;
            direction.y -= 300;
            this.particles.push(
                new Particle(
                    { x: this.info.position.x, y: this.info.position.y },
                    direction,
                    this.info.particleType,
                    this.info.particleSize,
                    Random.nextGaussian(this.info.particleLifetime.mean, this.info.particleLifetime.stdev),
                    Random.nextDouble() * Math.PI * 2,
                    speed / 500,
                ),
            );
        }
    }

    public update(elapsedTime: number, platforms: Platform[]) {
        this.particles.forEach((particle) => particle.update(elapsedTime, platforms));
        this.particles = this.particles.filter((particle) => particle.lifetime > 0);
    }

    public render(ctx: CanvasRenderingContext2D) {
        this.particles.forEach((particle) => particle.render(ctx));
    }
}

/**
 * The system to handle all of the particle effects. Has an update and render function
 */
export class ParticleSystem {
    private effects: ParticleEffect[] = [];

    public update(elapsedTime: number, platforms: Platform[]) {
        this.effects.forEach((effect) => effect.update(elapsedTime, platforms));
        this.effects = this.effects.filter((effect) => effect.particles.length > 0);
    }

    public render(ctx: CanvasRenderingContext2D) {
        this.effects.forEach((effect) => effect.render(ctx));
    }

    public newEffect(info: ParticleEffectInfo) {
        this.effects.push(new ParticleEffect(info));
    }
}
