import { config } from "./config";

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
        this.elem.style.width = this.size + "px";
        this.elem.style.height = this.size + "px";
        this.elem.style.backgroundColor = color;
    }
}
