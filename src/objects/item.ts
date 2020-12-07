import { Config } from "../config";
import { Vector } from "../vector";
import { Size } from "../size";
import { Platform } from "./platform";
import { SerializedItem } from "../serialized/item";
import { Player } from "./player";


export type ItemType = "nullItem" | "bow" | "dagger" | "staff" | "axe" | "hammer";

export function getRandomWeapon(): ItemType {
    const random: number = Math.floor(Math.random() * 20);
    switch (random) {
        case 0 : 
            return "bow";
        case 1 : 
            return "dagger";
        case 2 : 
            return "staff";
        case 3 : 
            return "axe";
        case 4 : 
            return "hammer";
        default : 
            return "hammer";
    }
}

export abstract class Item {

    public itemSize: number = 25;

    constructor(public readonly config: Config,
        public itemType: ItemType,
        public position: Vector,
        public momentum: Vector,
        public life: number,
        ) {}

    public serialize(): SerializedItem {
        return {
            itemType: this.itemType,
            position: this.position,
            momentum: this.momentum,
            life: this.life,
        };
    }

    public pickUp(player: Player) {
        switch (this.itemType) {
            case "dagger" :
                player.weaponEquipped = "dagger";
                this.life = 0;
                break;
            case "staff" :
                player.weaponEquipped = "staff";
                this.life = 0;
                break;
            case "hammer" :
                player.weaponEquipped = "hammer";
                this.life = 0;
                break;
            case "axe" :
                player.weaponEquipped = "axe";
                this.life = 0;
                break;
            case "bow" :
                player.weaponEquipped = "bow";
                this.life = 0;
                break;
        }
    }

    public checkCollisionWithRectangularObject(object: { size: Size; position: Vector }, elapsedTime: number): boolean {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime + 10;
        if (
            futurePosX < object.position.x + object.size.width &&
            futurePosX + this.itemSize > object.position.x &&
            futurePosY <= object.position.y + object.size.height &&
            futurePosY + this.itemSize >= object.position.y
        ) {
            if (this.momentum.y >= 10) {
                this.momentum.y /= 1.2;
                this.momentum.y -= elapsedTime * 2000;
                this.momentum.x /= 1.05;
                this.position.y = object.position.y - this.itemSize - 10;
                return true;
            } else if (this.momentum.y >= -10) {
                this.momentum.y = 0;
                this.momentum.x /= 1.05;
                this.position.y = object.position.y - this.itemSize - 10;
                return true;
            }
        }
        return false;
    }

    public checkSideCollision(elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime + 20;
        if (futurePosX + this.itemSize > this.config.xSize || futurePosX < 0) this.momentum.x *= -0.9;
        if (futurePosY + this.itemSize > this.config.ySize || futurePosY < 0) this.momentum.y *= -0.4;
    }

    public update(elapsedTime: number, platforms: Platform[]) {

        this.life -= elapsedTime;
        
        var ifOnGround: boolean = false;
        platforms.forEach((platform) => {
            if (this.checkCollisionWithRectangularObject(platform, elapsedTime)) ifOnGround = true;
        });
        this.checkSideCollision(elapsedTime);
        
        if (!ifOnGround) this.momentum.y += elapsedTime * 700;

        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;
    }
}
