import { config } from "./config";

export class Blast {
    constructor(
        public posX: number,
        public posY: number,
        public elem: HTMLElement,
        public color: string,
        public opacity: number,
        public size: number = config.playerSize,
    ) {
        this.elem.style.width = this.size + "px";
        this.elem.style.height = this.size + "px";
        this.elem.style.backgroundColor = color;
    }
}
