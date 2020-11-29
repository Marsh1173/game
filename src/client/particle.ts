import { Distribution } from "../distribution";
import { Platform } from "../objects/platform";
import { Player } from "../objects/player";
import { Random } from "../random";
import { Size } from "../size";
import { Vector } from "../vector";

export type ParticleType = "ice particle" | "smoke particle" | "red fire particle" | "orange fire particle" | "levelUp particle" | "levelUp glow" | "colored particle" | "text particle";
export type ParticleEffectType = "levelUp" | "takeDamage" | "die" | "basicAttack" | "stealth" | "firestrikeIdle" | "fireballIdle" | "iceIdle" | "firestrikeExplode";

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

    public renderLevelupGlow(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.lifetime / (this.originalLife * 6);
        ctx.shadowBlur = 3;
        ctx.shadowColor = "white";
        ctx.fillStyle = "cyan";

        ctx.beginPath(); // circle
        ctx.arc(this.position.x, this.position.y, this.size.width, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
        ctx.globalAlpha = 1;
    }

    public renderParticle(ctx: CanvasRenderingContext2D) {
        switch (this.type) {
            case "colored particle":
                ctx.globalAlpha = this.lifetime / this.originalLife;
                ctx.shadowBlur = 1;
                ctx.shadowColor = "gray";
                ctx.fillStyle = this.color;
                break;
            case "levelUp particle":
                ctx.globalAlpha = Math.sqrt(this.lifetime / this.originalLife);
                ctx.shadowBlur = 5;
                ctx.shadowColor = "yellow";
                ctx.fillStyle = "white";
                break;
            case "red fire particle" :
                ctx.globalAlpha = this.lifetime / (this.originalLife * 3);
                ctx.shadowBlur = 7;
                ctx.shadowColor = "red";
                ctx.fillStyle = "#ff5900";
                break;
            case "orange fire particle" :
                ctx.globalAlpha = this.lifetime / this.originalLife;
                ctx.shadowBlur = 7;
                ctx.shadowColor = "orange";
                ctx.fillStyle = "#ff7b00";
                break;
            case "smoke particle" :
                ctx.globalAlpha = this.lifetime / (this.originalLife * 8);
                ctx.shadowBlur = 10;
                ctx.shadowColor = "white";
                ctx.fillStyle = "lightgray";
                break;
            case "ice particle" :
                ctx.globalAlpha = this.lifetime / (this.originalLife * 3);
                ctx.shadowBlur = 7;
                ctx.shadowColor = "white";
                ctx.fillStyle = "cyan";
                break;
        }
        ctx.fillRect(this.position.x - this.size.width / 2, this.position.y - this.size.height / 2, this.size.width, this.size.height);

        ctx.fillStyle = "gray";
        ctx.shadowColor = "gray";
        ctx.shadowBlur = 2;
        ctx.globalAlpha = 1;
    }

    public renderTextParticle(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.lifetime / this.originalLife;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "black";
        ctx.fillStyle = this.color;

        ctx.font = "30px sans-serif";
        ctx.fillText(this.color, this.position.x - 3, this.position.y);
        ctx.font = "10px sans-serif";

        ctx.shadowColor = "gray";
        ctx.globalAlpha = 1;
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

/*interface ParticleEffectInfo {
    particleType: ParticleType;
    position: Vector;
    particleSize: Size;
    particleSpeed: Distribution;
    particleLifetime: Distribution;
    particleAmt: number;
}*/

interface ParticleEffectInfo {
    particleEffectType: ParticleEffectType;
    position: Vector;
    momentum: Vector,
    direction: Vector;
    color: string;
    targetPosition?: Vector,
}

class ParticleEffect {
    public particles: Particle[];
    constructor(private readonly info: ParticleEffectInfo) {
        this.particles = [];
        if (info.particleEffectType === "levelUp") this.levelUp(info);
        else if (info.particleEffectType === "stealth") this.stealth(info);
        else if (info.particleEffectType === "die") this.die(info);
        else if (info.particleEffectType === "firestrikeIdle") this.firestrikeIdle(info);
        else if (info.particleEffectType === "fireballIdle") this.fireballIdle(info);
        else if (info.particleEffectType === "iceIdle") this.iceIdle(info);
        else if (info.particleEffectType === "firestrikeExplode") this.firestrikeExplode(info);
    }

    public levelUp(info: ParticleEffectInfo) {
        for (let i = 0; i < 140; i++) {
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
        /*for (let i = 0; i < 15; i++) {
            const angle: number = Math.random()*Math.PI*2; // this included with position places the circle in a random point in an imaginary circle
            const radius: number = Random.nextGaussian(100, 25);
            setTimeout(() => {
                this.particles.push(
                    new Particle(
                        { x: this.info.position.x + Math.cos(angle)*radius, y: this.info.position.y + Math.sin(angle)*radius - 5 },
                        {x: 0, y: 0},
                        "levelUp glow",
                        {width: 10, height: 10},
                        0.05,
                        false,
                        Random.nextGaussian(1, 0.4),
                        Random.nextDouble() * Math.PI * 2,
                        0,
                    ),
                );
            }, Math.random() * 300);
        }*/
    }

    public die(info: ParticleEffectInfo) {
        for (let i = 0; i < 50; i++) {
            const momentumFactor: number = Random.nextGaussian(1, 0.3);
            const randomX: number = this.info.position.x + (Math.random() * 40 - 20);
            const randomY: number = this.info.position.y + (Math.random() * 40 - 20);

            this.particles.push(
                new Particle(
                    { x: randomX, y: randomY },
                    {x: info.momentum.x * momentumFactor - (info.position.x - randomX), y: info.momentum.y * momentumFactor - (info.position.y - randomY)},
                    "colored particle",
                    {width: 5, height: 5},
                    1,
                    1,
                    5,
                    info.color,
                    Random.nextGaussian(3, 0.2),
                    Random.nextDouble() * Math.PI * 2,
                    0,
                ),
            );
        }
    }

    public stealth(info: ParticleEffectInfo) {
        for (let i = 0; i < 60; i++) {
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
        for (let i = 0; i < 5; i++) {
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
        for (let i = 0; i < 10; i++) {
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
        for (let i = 0; i < 150; i++) {
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
        for (let i = 0; i < 150; i++) {
            const direction = Random.nextCircleVector();
            const speed = Random.nextGaussian(1000, 650);
            direction.x *= speed;
            direction.y *= speed;
            this.particles.push(
                new Particle(
                    { x: this.info.position.x, y: this.info.position.y },
                    {x: direction.x, y: direction.y},
                    "red fire particle",
                    {width: 10, height: 10},
                    -0.6,
                    0,
                    15,
                    info.color,
                    Random.nextGaussian(0.4, 0.1),
                    Random.nextDouble() * Math.PI * 2,
                    speed / 500,
                ),
            );
        }
    }

    public fireballIdle(info: ParticleEffectInfo) {
        for (let i = 0; i < 3; i++) {
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
        for (let i = 0; i < 3; i++) {
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
        for (let i = 0; i < 2; i++) {
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
                particle.type === "ice particle"
                )particle.renderParticle(ctx);
                else if (particle.type === "levelUp glow")particle.renderLevelupGlow(ctx);
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
