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

    public playerPathfind( player2: Player) {

        let distanceX = player2.posX - (this.posX + this.momentumX);
        let distanceY = player2.posY - (this.posY + this.momentumY);

        if (
            distanceX <= config.playerSize &&
            distanceX >= -config.playerSize &&
            distanceY <= config.playerSize &&
            distanceY >= -config.playerSize
        ) {
            if (Math.abs(distanceX) <= Math.abs(distanceY)) {
                if (distanceY < 0) {
                    //hitting someone from beneath
                    this.posY = player2.posY + config.playerSize;
                    if (this.momentumY <= 0) {
                        this.momentumY = 0;
                    }
                } else if (distanceY > 0) {
                    //hitting someone from above
                    this.standing = true;
                    this.posY = player2.posY - config.playerSize;
                    if (this.momentumY > 0) {
                        this.momentumY = 0;
                    }
                }
            } else {
                if (distanceX > 0) {
                    //hitting someone from their left?
                    this.posX = player2.posX - config.playerSize;
                    this.momentumX = 0;
                } else {
                    //hitting someone from their right?
                    this.posX = player2.posX + config.playerSize;
                    this.momentumX = 0;
                }
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
