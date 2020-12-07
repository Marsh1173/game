import { Config } from "../config";
import { Item, ItemType } from "../objects/item";
import { SerializedItem } from "../serialized/item";

export class ServerItem extends Item {
    constructor(config: Config, info: SerializedItem) {
        super(config, 
            info.itemType,
            info.position,
            info.momentum,
            info.life,);
    }
}
