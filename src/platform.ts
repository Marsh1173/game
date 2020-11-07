import { Player } from "./player";
import { Size } from "./size";
import { box } from "./util";
import { Vector } from "./vector";

export class Platform {
    private readonly elem: HTMLDivElement;

    constructor(public readonly size: Size, public readonly position: Vector) {
        this.elem = document.createElement("div");
        this.elem.classList.add("platform");
        this.render();
        box.appendChild(this.elem);
    }

    public delete() {
        this.elem.remove();
    }

    public render() {
        this.elem.style.height = this.size.height + "px";
        this.elem.style.width = this.size.width + "px";
        this.elem.style.left = this.position.x + "px";
        this.elem.style.top = this.position.y + "px";
    }
}
