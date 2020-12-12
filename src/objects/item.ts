import { Config } from "../config";
import { Vector } from "../vector";
import { Size } from "../size";
import { Platform } from "./platform";
import { SerializedItem } from "../serialized/item";
import { Player } from "./player";


export type ItemType = "nullItem" | "bow" | "dagger" | "staff" | "axe" | "hammer";

export function getRandomWeapon(): ItemType {
    const random: number = Math.floor(Math.random() * 10);
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
            return "nullItem";
    }
}

export abstract class Item {

    public itemSize: number = 25;
    public totalLife: number;
    private ifOnGround: boolean = false;

    constructor(public readonly config: Config,
        public itemType: ItemType,
        public id: number,
        public position: Vector,
        public momentum: Vector,
        public life: number,
        ) {
            this.totalLife = life;
        }

    public serialize(): SerializedItem {
        return {
            itemType: this.itemType,
            id: this.id,
            position: this.position,
            momentum: this.momentum,
            life: this.life,
        };
    }

    public pickUp(player: Player): boolean {
        switch (this.itemType) {
            case "dagger" :
                player.weaponEquipped = "dagger";
                return true;
            case "staff" :
                player.weaponEquipped = "staff";
                return true;
            case "hammer" :
                player.weaponEquipped = "hammer";
                return true;
            case "axe" :
                player.weaponEquipped = "axe";
                return true;
            case "bow" :
                player.weaponEquipped = "bow";
                return true;
            default :
                return false;
        }
    }

    private checkCollisionWithRectangularObject(object: { size: Size; position: Vector }, elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (
            futurePosX < object.position.x + object.size.width &&
            futurePosX + this.itemSize > object.position.x &&
            futurePosY < object.position.y + object.size.height &&
            futurePosY + this.itemSize > object.position.y
        ) {
            const points: Vector[] = [
                {
                    // above
                    x: this.position.x,
                    y: object.position.y - this.itemSize,
                },
                {
                    // below
                    x: this.position.x,
                    y: object.position.y + object.size.height,
                },
                {
                    // left
                    x: object.position.x - this.itemSize,
                    y: this.position.y,
                },
                {
                    // right
                    x: object.position.x + object.size.width,
                    y: this.position.y,
                },
            ];

            const distances = points.map((point) => Math.sqrt((point.x - this.position.x) ** 2 + (point.y - this.position.y) ** 2));

            let smallest = distances[0];
            let smallestIndex = 0;
            distances.forEach((distance, i) => {
                if (distance < smallest) {
                    smallest = distance;
                    smallestIndex = i;
                }
            });

            this.position.x = points[smallestIndex].x;
            this.position.y = points[smallestIndex].y;
            switch (smallestIndex) {
                case 0: // above
                    if (this.momentum.y > 0) this.momentum.y = 0;
                    this.ifOnGround = true;
                    break;
                case 1: // below
                    if (this.momentum.y < 0) this.momentum.y = 0;
                    break;
                case 2: // left
                    if (this.momentum.x > 0) this.momentum.x = 0;
                    break;
                case 3: // right
                    if (this.momentum.x < 0) this.momentum.x = 0;
                    break;
            }
        }
    }

    private checkCollisionWithItem(item: Item) {
        if (
            this.position.x < item.position.x + item.itemSize &&
            this.position.x + this.itemSize > item.position.x &&
            this.position.y < item.position.y + item.itemSize &&
            this.position.y + this.itemSize > item.position.y
        ) {
            const xDistance: number = (item.position.x - this.position.x);
            if (xDistance > 0) this.momentum.x -= 20;
            else this.momentum.x += 20;
        }
    }

    public checkSideCollision(elapsedTime: number) {
        let futurePosX = this.position.x + this.momentum.x * elapsedTime;
        let futurePosY = this.position.y + this.momentum.y * elapsedTime;
        if (futurePosX + this.itemSize > this.config.xSize || futurePosX < 0) this.momentum.x *= -0.9;
        if (futurePosY + this.itemSize > this.config.ySize || futurePosY < 0) {
            this.position.y = this.config.ySize - this.itemSize;
            this.momentum.y = 0;
            this.ifOnGround = true;
        }
    }

    public update(elapsedTime: number, platforms: Platform[], items: Item[]) {

        this.life -= elapsedTime;
        
        this.ifOnGround = false;
        platforms.forEach((platform) => {
            (this.checkCollisionWithRectangularObject(platform, elapsedTime))
        });
        items.forEach((item) => {
            if (item != this) this.checkCollisionWithItem(item);
        });
        this.checkSideCollision(elapsedTime);
        
        if (!this.ifOnGround) this.momentum.y += elapsedTime * 700;
        else {
            if (Math.abs(this.momentum.x) < 10) this.momentum.x = 0;
            else this.momentum.x *= 1 - elapsedTime * 10;
        }

        this.position.x += this.momentum.x * elapsedTime;
        this.position.y += this.momentum.y * elapsedTime;
    }
}
