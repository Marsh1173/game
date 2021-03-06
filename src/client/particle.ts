import { Distribution } from "../distribution";
import { Platform } from "../objects/platform";
import { Random } from "../random";
import { Size } from "../size";
import { Vector } from "../vector";
import { Game } from "./game";

export type ParticleType = "ice particle" | "smoke particle" | "red fire particle" | "orange fire particle" | "levelUp particle" | "colored particle" | "text particle" | "blizzard particle";
export type ParticleEffectType = "levelUp" | "takeDamage" | "die" | "basicAttack" | "stealth" | "firestrikeIdle" | "fireballIdle" | "iceIdle" | "firestrikeExplode" | "blizzardIdle";

class Particle {
    public originalLife: number;
    /*public static readonly images: Record<ParticleType, HTMLImageElement> = {
        smoke: new Image(),
        fire: new Image(),
    };*/
    /**
     * @param position the _center_ of where the particle is
     * @param lifetime the lifetime of the particle
     */
    constructor(
        private position: Vector,
        private momentum: Vector,
        public type: ParticleType,
        private size: Size,
        private gravity: number,
        private ifPhysics: number,
        private ifMomentumDampen: number,
        private color: string,
        public lifetime: number,
        public rotation: number,
        public rotationMomentum: number,
        public targetPosition?: Vector,
        public imagePath?: HTMLImageElement,
    ) {
        this.originalLife = this.lifetime;
    }

    public checkCollisionWithRectangularObject(object: { size: Size; position: Vector }, elapsedTime: number, bounce: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (
            futurePosX < object.position.x + object.size.width &&
            futurePosX > object.position.x &&
            futurePosY < object.position.y + object.size.height &&
            futurePosY + this.size.height / 2 > object.position.y
        ) {
            if (this.momentum.y < 0) {
                this.position.y = object.position.y + object.size.height;
                this.momentum.y *= -bounce * Random.nextGaussian(1, 0.7);
            } else {
                this.position.y = object.position.y + this.momentum.y * -elapsedTime - this.size.height / 2;
                this.momentum.y *= -bounce * Random.nextGaussian(0.6, 0.5);
            }
        }
    }

    public update(elapsedTime: number, platforms: Platform[]) {
        if (this.ifPhysics != 0) platforms.forEach((platform) => this.checkCollisionWithRectangularObject(platform, elapsedTime, this.ifPhysics));
        this.momentum.y += elapsedTime * 1200 * this.gravity;
        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;
        this.rotation += this.rotationMomentum * elapsedTime;

        if (this.targetPosition) {
            this.momentum.x += Math.random() * ((this.targetPosition.x + 25) - this.position.x) * elapsedTime;
            this.momentum.y += Math.random() * ((this.targetPosition.y + 25) - this.position.y) * elapsedTime;
        }
        if (this.ifMomentumDampen != 1) {
            this.momentum.x *= 1 - (this.ifMomentumDampen * elapsedTime);
            this.momentum.y *= 1 - (this.ifMomentumDampen * elapsedTime);
        }
        this.lifetime -= elapsedTime;
    }

    public renderParticle(ctx: CanvasRenderingContext2D) {
        ctx.save();
        switch (this.type) {
            case "colored particle":
                ctx.globalAlpha = this.lifetime / this.originalLife;
                ctx.shadowBlur = 1;
                ctx.shadowColor = this.color;
                ctx.fillStyle = this.color;
                break;
            case "levelUp particle":
                ctx.globalAlpha = Math.sqrt(this.lifetime / this.originalLife);
                ctx.shadowBlur = 7;
                ctx.shadowColor = "yellow";
                ctx.fillStyle = "white";
                break;
            case "red fire particle" :
                ctx.globalAlpha = this.lifetime / (this.originalLife);
                ctx.shadowBlur = 0;
                ctx.shadowColor = "none";
                ctx.fillStyle = "#ff5900";
                break;
            case "orange fire particle" :
                ctx.globalAlpha = this.lifetime / this.originalLife;
                ctx.shadowBlur = 0;
                ctx.shadowColor = "none";
                ctx.fillStyle = "#ff7b00";
                break;
            case "smoke particle" :
                ctx.globalAlpha = this.lifetime / (this.originalLife * 6);
                ctx.shadowBlur = 0;
                ctx.shadowColor = "none";
                ctx.fillStyle = "darkgray";
                break;
            case "ice particle" :
                ctx.globalAlpha = this.lifetime / (this.originalLife * 3);
                ctx.shadowBlur = 1;
                ctx.shadowColor = "white";
                ctx.fillStyle = "cyan";
                break;
            case "blizzard particle" :
                ctx.globalAlpha = this.lifetime / (this.originalLife * 2);
                ctx.shadowBlur = 3;
                ctx.shadowColor = "white";
                ctx.fillStyle = "cyan";
                break;
        }
        ctx.fillRect(this.position.x - this.size.width / 2, this.position.y - this.size.height / 2, this.size.width, this.size.height);

        ctx.restore()
    }

    public renderTextParticle(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.lifetime / this.originalLife;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "black";
        ctx.fillStyle = this.color;

        ctx.font = "30px sans-serif";
        ctx.fillText(this.color, this.position.x - 3, this.position.y);
        ctx.font = "10px sans-serif";

        ctx.restore();
    }

    public renderImage(ctx: CanvasRenderingContext2D) {
        if (!this.imagePath) {
            console.log(this.type + " particle error!");
            return;
        }
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.translate(-this.position.x, -this.position.y);
        ctx.drawImage(
            this.imagePath,
            this.position.x - this.size.width / 2,
            this.position.y - this.size.height / 2,
            this.size.width,
            this.size.height,
        );
        ctx.restore();
    }
}
/*Object.keys(Particle.images).forEach((imageKey) => {
    Particle.images[imageKey as ParticleType].src = "images/particles/" + imageKey + ".png";
});*/

interface ParticleEffectInfo {
    particleEffectType: ParticleEffectType;
    position: Vector;
    momentum: Vector,
    direction: Vector;
    color: string;
    targetPosition?: Vector,
}

class ParticleEffect {
    public particles: Particle[] = [];
    constructor(private readonly info: ParticleEffectInfo) {
        if (Game.particleAmount === 0) return;
        if (info.particleEffectType === "levelUp") this.levelUp(info);
        else if (info.particleEffectType === "stealth") this.stealth(info);
        else if (info.particleEffectType === "die") this.die(info);
        else if (info.particleEffectType === "firestrikeIdle") this.firestrikeIdle(info);
        else if (info.particleEffectType === "fireballIdle") this.fireballIdle(info);
        else if (info.particleEffectType === "iceIdle") this.iceIdle(info);
        else if (info.particleEffectType === "firestrikeExplode") this.firestrikeExplode(info);
        else if (info.particleEffectType === "blizzardIdle") this.blizzardIdle(info);
    }

    public levelUp(info: ParticleEffectInfo) {
        for (let i = 0; i < Math.floor(140 * Game.particleAmount); i++) {
            const direction = Random.nextCircleVector();
            const speed = Random.nextGaussian(150, 45);
            direction.x *= speed;
            direction.y *= speed;
            this.particles.push(
                new Particle(
                    { x: this.info.position.x, y: this.info.position.y },
                    {x: direction.x + info.momentum.x, y: direction.y + info.momentum.y},
                    "levelUp particle",
                    {width: 3, height: 3},
                    0,
                    0,
                    5,
                    info.color,
                    Random.nextGaussian(0.9, 0.3),
                    Random.nextDouble() * Math.PI * 2,
                    speed / 500,
                ),
            );
        }
    }

    public die(info: ParticleEffectInfo) {
        for (let i = 0; i < Math.floor(100 * Game.particleAmount); i++) {
            const momentumFactor: number = Random.nextGaussian(0.6, 0.3);
            const randomX: number = this.info.position.x + (Math.random() * 50 - 25);
            const randomY: number = this.info.position.y + (Math.random() * 50 - 25);
            const randomSize: number = (Math.random() * 4 + 3);

            this.particles.push(
                new Particle(
                    { x: randomX, y: randomY },
                    {x: info.momentum.x * momentumFactor - (info.position.x - randomX) * 8, y: info.momentum.y * momentumFactor - (info.position.y - randomY) * 8},
                    "colored particle",
                    {width: randomSize, height: randomSize},
                    0.8,
                    0.7,
                    3,
                    info.color,
                    Random.nextGaussian(5, 0.2),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
    }

    public stealth(info: ParticleEffectInfo) {
        for (let i = 0; i < Math.floor(60 * Game.particleAmount); i++) {
            const momentumFactor: number = Random.nextGaussian(0.9, 0);
            this.particles.push(
                new Particle(
                    { x: this.info.position.x + (Math.random() * 50 - 25), y: this.info.position.y + (Math.random() * 50 - 25) },
                    {x: info.momentum.x * momentumFactor, y: info.momentum.y * momentumFactor},
                    "colored particle",
                    {width: 5, height: 5},
                    0,
                    0,
                    3,
                    info.color,
                    Random.nextGaussian(0.5, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
    }

    public firestrikeIdle(info: ParticleEffectInfo) {
        let particleFactor: number =  Math.floor(Math.random() + Game.particleAmount) * 5;
        for (let i = 0; i < particleFactor; i++) {
            const momentumFactor: number = Random.nextGaussian(1, 0.3);
            const randomX: number = this.info.position.x + (Math.random() * 110 - 55);
            const randomY: number = this.info.position.y + (Math.random() * 110 - 55);

            this.particles.push(
                new Particle(
                    { x: randomX, y: randomY },
                    {x: info.momentum.x * momentumFactor - (info.position.x - randomX) * 5, y: info.momentum.y * momentumFactor  - (info.position.y - randomY)},
                    "smoke particle",
                    {width: 10, height: 10},
                    -0.6,
                    0,
                    10,
                    info.color,
                    Random.nextGaussian(0.3, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
        particleFactor =  Math.floor(Math.random() + Game.particleAmount) * 10;
        for (let i = 0; i < particleFactor; i++) {
            const momentumFactor: number = Random.nextGaussian(1, 0.3);
            const randomX: number = this.info.position.x + (Math.random() * 100 - 50);
            const randomY: number = this.info.position.y + (Math.random() * 100 - 50);

            this.particles.push(
                new Particle(
                    { x: randomX, y: randomY },
                    {x: info.momentum.x * momentumFactor - (info.position.x - randomX) * 5, y: info.momentum.y * momentumFactor / 5},
                    "red fire particle",
                    {width: 7, height: 7},
                    0.1,
                    0,
                    10,
                    info.color,
                    Random.nextGaussian(0.4, 0.2),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
    }

    public firestrikeExplode(info: ParticleEffectInfo) {
        for (let i = 0; i < Math.floor(150 * Game.particleAmount); i++) {
            const direction = Random.nextCircleVector();
            const speed = Random.nextGaussian(1000, 650);
            direction.x *= speed;
            direction.y *= speed;
            this.particles.push(
                new Particle(
                    { x: this.info.position.x, y: this.info.position.y },
                    {x: direction.x, y: direction.y},
                    "smoke particle",
                    {width: 20, height: 20},
                    -0.8,
                    0,
                    15,
                    info.color,
                    Random.nextGaussian(0.4, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    speed / 500,
                ),
            );
        }
        for (let i = 0; i < Math.floor(150 * Game.particleAmount); i++) {
            const direction = Random.nextCircleVector();
            const speed = Random.nextGaussian(600, 100);
            direction.x *= speed;
            direction.y *= speed;
            this.particles.push(
                new Particle(
                    { x: this.info.position.x, y: this.info.position.y },
                    {x: direction.x, y: direction.y - 100},
                    "red fire particle",
                    {width: 10, height: 10},
                    0.3,
                    1,
                    3,
                    info.color,
                    Random.nextGaussian(0.6, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    speed / 500,
                ),
            );
        }
    }

    public fireballIdle(info: ParticleEffectInfo) {
        let particleFactor: number =  Math.floor(Math.random() + Game.particleAmount) * 2;
        for (let i = 0; i < particleFactor; i++) {
            const momentumFactor: number = Random.nextGaussian(0.8, 0.3);
            const randomX: number = this.info.position.x + (Math.random() * 14 - 7);
            const randomY: number = this.info.position.y + (Math.random() * 14 - 7);

            this.particles.push(
                new Particle(
                    { x: randomX, y: randomY },
                    {x: info.momentum.x * momentumFactor - (info.position.x - randomX), y: info.momentum.y * momentumFactor  - (info.position.y - randomY)},
                    "smoke particle",
                    {width: 6, height: 6},
                    -0.6,
                    0.1,
                    10,
                    info.color,
                    Random.nextGaussian(0.3, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
        particleFactor =  Math.floor(Math.random() + Game.particleAmount) * 2;
        for (let i = 0; i < particleFactor; i++) {
            const momentumFactor: number = Random.nextGaussian(0.8, 0.3);
            const randomX: number = this.info.position.x + (Math.random() * 20 - 10);
            const randomY: number = this.info.position.y + (Math.random() * 20 - 10);

            this.particles.push(
                new Particle(
                    { x: randomX, y: randomY },
                    {x: info.momentum.x * momentumFactor - (info.position.x - randomX), y: info.momentum.y * momentumFactor  - (info.position.y - randomY)},
                    "orange fire particle",
                    {width: 4, height: 4},
                    -0.3,
                    0.1,
                    10,
                    info.color,
                    Random.nextGaussian(0.3, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
    }

    public iceIdle(info: ParticleEffectInfo) {
        const particleFactor: number =  Math.floor(Math.random() + Game.particleAmount) * 2;
        for (let i = 0; i < particleFactor; i++) {
            const momentumFactor: number = Random.nextGaussian(1, 0.3);
            const randomX: number = this.info.position.x + (Math.random() * 20 - 10);
            const randomY: number = this.info.position.y + (Math.random() * 20 - 10);

            this.particles.push(
                new Particle(
                    { x: randomX, y: randomY },
                    {x: info.momentum.x * momentumFactor - (info.position.x - randomX), y: info.momentum.y * momentumFactor  - (info.position.y - randomY)},
                    "ice particle",
                    {width: 3, height: 3},
                    0,
                    0.01,
                    10,
                    info.color,
                    Random.nextGaussian(0.5, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
    }

    public blizzardIdle(info: ParticleEffectInfo) {
        const particleFactor: number =  Math.floor(Math.random() + Game.particleAmount) * 2;
        for (let i = 0; i < particleFactor; i++) {
            const randomX: number = this.info.position.x + (Math.random() * 340 - 160);
            const randomY: number = this.info.position.y + (Math.random() * 115 - 125);
            const randomSize: number = Math.floor(Math.random() * 3 + 3);
                this.particles.push(
                    new Particle(
                        { x: randomX, y: randomY },
                        {x: info.momentum.x, y: info.momentum.y},
                        "blizzard particle",
                        {width: randomSize, height: randomSize},
                        0.1,
                        0,
                        0.4,
                        info.color,
                        Random.nextGaussian(1.5, 0.1),
                        Random.nextDouble() * Math.PI * 2,
                        0,
                    ),
                );
        }
        
    }

    public update(elapsedTime: number, platforms: Platform[]) {
        this.particles.forEach((particle) => particle.update(elapsedTime, platforms));
        this.particles = this.particles.filter((particle) => particle.lifetime > 0);
    }

    public render(ctx: CanvasRenderingContext2D) {
        this.particles.forEach((particle) => {
            if (particle.imagePath) particle.renderImage(ctx);
            else {
                if (particle.type === "levelUp particle" ||
                particle.type === "colored particle" ||
                particle.type === "red fire particle" ||
                particle.type === "orange fire particle" ||
                particle.type === "smoke particle" ||
                particle.type === "ice particle" ||
                particle.type === "blizzard particle"
                )particle.renderParticle(ctx);
                else if (particle.type === "text particle")particle.renderTextParticle(ctx);
            }
        });
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
