import { config } from "./config";
import { box } from "./util";

export class Blast {
    public opacity = 1.0;
    private elem: HTMLDivElement;

    constructor(public posX: number, public posY: number, public color: string, public size: number = config.playerSize) {
        this.elem = document.createElement("div");
        this.elem.classList.add("blast");
        this.updateStyle();
        box.appendChild(this.elem);
    }

    public delete() {
        this.elem.remove();
    }

    public update() {
        // reduce blast opacity
        this.posX -= config.playerSize / 6;
        this.posY -= config.playerSize / 6;
        this.size += config.playerSize / 3;
        this.opacity -= 0.05;
        this.updateStyle();
        if (this.opacity <= 0) {
            this.delete();
        }
    }

    private updateStyle() {
        this.elem.style.left = this.posX + "px";
        this.elem.style.top = this.posY + "px";
        this.elem.style.width = this.size + "px";
        this.elem.style.height = this.size + "px";
        this.elem.style.borderRadius = this.size / 2 + "px";
        this.elem.style.backgroundColor = this.color;
        this.elem.style.opacity = this.opacity.toString();
    }
}
