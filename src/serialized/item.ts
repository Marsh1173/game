import { Item, ItemType } from "../objects/item";
import { Vector } from "../vector";

export interface SerializedItem {
    itemType: ItemType;
    position: Vector;
    momentum: Vector;
    life: number;
}
