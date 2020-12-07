import { Config } from "../config";
import { Item } from "../objects/item";
import { SerializedItem } from "../serialized/item";
import { assetManager } from "./assetmanager";

export class ClientItem extends Item {

    constructor(config: Config, info: SerializedItem) {

        super(config,          
            info.itemType,
            info.position,
            info.momentum,
            info.life,);

    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        let img: CanvasImageSource = assetManager.images["axe"];

        switch (this.itemType) {
            case "axe" :
                img = assetManager.images["axe"];
                break;
            case "bow" :
                img = assetManager.images["bow"];
                break;
            case "dagger" :
                img = assetManager.images["dagger"];
                break;
            case "hammer" :
                img = assetManager.images["hammer"];
                break;
            case "staff" :
                img = assetManager.images["staff"];
                break;
        }

        ctx.shadowBlur = 3;
        ctx.shadowColor = "black";
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.6;
        ctx.fillRect(this.position.x, this.position.y, this.itemSize, this.itemSize);
        ctx.drawImage(img, this.position.x, this.position.y, this.itemSize, this.itemSize);
        
        ctx.restore();
    }
}
