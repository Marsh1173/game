import { config } from "./config";
import { Platform } from "./platform";
import { Vector } from "./vector";

export class Player {
    constructor(
        public posX: number,
        public posY: number,
        public keyUp: string,
        public keyDown: string,
        public keyLeft: string,
        public keyRight: string,
        public elem: HTMLElement,
        public color: string,
        public size: number = config.playerSize,
        public momentumX: number = 0,
        public momentumY: number = 0,
        public blastCounter: number = 0,
        public alreadyJumped: number = 0,
        public canJump: boolean = true,
        public standing: boolean = false,
        public wasStanding: boolean = false,
        public isDead: boolean = false,
    ) {
        this.render();
    }

    public checkCollisionWithPlatform(platform: Platform) {
        if (
            this.posX < platform.position.x + platform.size.width &&
            this.posX + this.size > platform.position.x &&
            this.posY < platform.position.y + platform.size.height &&
            this.posY + this.size > platform.position.y
        ) {
            const points: Vector[] = [
                {
                    // above
                    x: this.posX,
                    y: platform.position.y - this.size,
                },
                {
                    // below
                    x: this.posX,
                    y: platform.position.y + platform.size.height,
                },
                {
                    // left
                    x: platform.position.x - this.size,
                    y: this.posY,
                },
                {
                    // right
                    x: platform.position.x + platform.size.width,
                    y: this.posY,
                },
            ];

            const distances = points.map((point) => Math.sqrt((point.x - this.posX) ** 2 + (point.y - this.posY) ** 2));

            let smallest = distances[0];
            let smallestIndex = 0;
            distances.forEach((distance, i) => {
                if (distance < smallest) {
                    smallest = distance;
                    smallestIndex = i;
                }
            });

            this.posX = points[smallestIndex].x;
            this.posY = points[smallestIndex].y;
            switch (smallestIndex) {
                case 0: // above
                    this.momentumY = 0;
                    this.standing = true;
                    break;
                case 1: // below
                    this.momentumY = 0;
                    break;
                case 2: // left
                    this.momentumX = 0;
                    break;
                case 3: // right
                    this.momentumX = 0;
                    break;
            }
        }
    }

    public render() {
        this.elem.style.width = this.size + "px";
        this.elem.style.height = this.size + "px";
        this.elem.style.backgroundColor = this.color;
        this.elem.style.opacity = "1";
    }
}
