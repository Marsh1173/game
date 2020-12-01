import { ServerTalker } from "./servertalker";

export type ImageName = "wizard-hat" | "hammer" | "sword" | "staff" | "axe" | "fire" | "ice" | "shuriken" | "firestrike" | "arrow";
const imageInformation: Record<ImageName, string> = {
    "wizard-hat": `http://${ServerTalker.hostName}/images/wizard-hat.png`,
    "hammer": `http://${ServerTalker.hostName}/images/hammer.png`,
    "sword": `http://${ServerTalker.hostName}/images/sword.png`,
    "staff": `http://${ServerTalker.hostName}/images/staff.png`,
    "axe": `http://${ServerTalker.hostName}/images/axe.png`,
    "fire": `http://${ServerTalker.hostName}/images/projectiles/fire.png`,
    "ice": `http://${ServerTalker.hostName}/images/projectiles/ice.png`,
    "shuriken": `http://${ServerTalker.hostName}/images/projectiles/shuriken.png`,
    "arrow": `http://${ServerTalker.hostName}/images/projectiles/arrow.png`,
    "firestrike": `http://${ServerTalker.hostName}/images/targetedProjectiles/firestrike.png`,
};

class AssetManager {
    public images: Record<ImageName, HTMLImageElement>;
    // public sounds: Record<string, HTMLImageElement>;

    constructor() {
        this.images = {} as Record<ImageName, HTMLImageElement>;
        Object.keys(imageInformation).forEach((imageName) => {
            this.addImage(imageName as ImageName, imageInformation[imageName as ImageName]);
        });
    }
    public async addImage(name: ImageName, source: string) {
        return new Promise<void>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", source, true);
            xhr.responseType = "blob";
            xhr.onload = () => {
                if (xhr.status === 200) {
                    let asset = new Image();
                    asset.onload = () => {
                        window.URL.revokeObjectURL(asset.src);
                    };
                    asset.src = window.URL.createObjectURL(xhr.response);
                    this.images[name] = asset;
                    resolve();
                } else {
                    reject(`Asset ${name} rejected with error code ${xhr.status}`);
                }
            };
            xhr.onerror = (error) => {
                reject(error);
            };
            xhr.send();
        });
    }
}

export const assetManager = new AssetManager();
