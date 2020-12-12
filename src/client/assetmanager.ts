import { ServerTalker } from "./servertalker";

export type ImageName = "wizard-hat" | "hammer" | "dagger" | "staff" | "axe" | "bow" |
                    "fire" | "ice" | "shuriken" | "meteorstrike" | "arrow" |
                    "chainsIcon" | "fireballIcon" | "meteorStrikeIcon" | "hammerIcon" |
                    "iceIcon" | "shieldslamIcon" | "shurikenIcon" | "staffIcon" | "stealthIcon" | "poisonedSwordIcon" | 
                    "axeIcon" | "bowIcon" | "fistIcon" | "blizzardIcon" | "healingAuraIcon" | "chargeIcon"; 
const imageInformation: Record<ImageName, string> = {
    "wizard-hat": `http://${ServerTalker.hostName}/images/wizard-hat.png`,
    "hammer": `http://${ServerTalker.hostName}/images/hammer.png`,
    "dagger": `http://${ServerTalker.hostName}/images/dagger.png`,
    "staff": `http://${ServerTalker.hostName}/images/staff.png`,
    "axe": `http://${ServerTalker.hostName}/images/axe.png`,
    "bow": `http://${ServerTalker.hostName}/images/bow.png`,
    "fire": `http://${ServerTalker.hostName}/images/projectiles/fire.png`,
    "ice": `http://${ServerTalker.hostName}/images/projectiles/ice.png`,
    "shuriken": `http://${ServerTalker.hostName}/images/projectiles/shuriken.png`,
    "arrow": `http://${ServerTalker.hostName}/images/projectiles/arrow.png`,
    "meteorstrike": `http://${ServerTalker.hostName}/images/targetedProjectiles/firestrike.png`,
    "chainsIcon": `http://${ServerTalker.hostName}/images/abilities/chainsIcon.png`,
    "fireballIcon": `http://${ServerTalker.hostName}/images/abilities/fireballIcon.png`,
    "meteorStrikeIcon": `http://${ServerTalker.hostName}/images/abilities/meteorStrikeIcon.png`,
    "hammerIcon": `http://${ServerTalker.hostName}/images/abilities/hammerIcon.png`,
    "iceIcon": `http://${ServerTalker.hostName}/images/abilities/iceIcon.png`,
    "shieldslamIcon": `http://${ServerTalker.hostName}/images/abilities/shieldslamIcon.png`,
    "shurikenIcon": `http://${ServerTalker.hostName}/images/abilities/shurikenIcon.png`,
    "staffIcon": `http://${ServerTalker.hostName}/images/abilities/staffIcon.png`,
    "stealthIcon": `http://${ServerTalker.hostName}/images/abilities/stealthIcon.png`,
    "poisonedSwordIcon": `http://${ServerTalker.hostName}/images/abilities/poisonedSwordIcon.png`,
    "bowIcon": `http://${ServerTalker.hostName}/images/abilities/bowIcon.png`,
    "axeIcon": `http://${ServerTalker.hostName}/images/abilities/axeIcon.png`,
    "fistIcon": `http://${ServerTalker.hostName}/images/abilities/fistIcon.png`,
    "blizzardIcon": `http://${ServerTalker.hostName}/images/abilities/blizzardIcon.png`,
    "healingAuraIcon": `http://${ServerTalker.hostName}/images/abilities/healingAuraIcon.png`,
    "chargeIcon": `http://${ServerTalker.hostName}/images/abilities/chargeIcon.png`,
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
