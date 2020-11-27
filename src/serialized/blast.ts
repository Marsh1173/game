import { SerializedPlayer } from "./player";
import { Vector } from "../vector";

export interface SerializedBlast {
    position: Vector;
    size: number;
    id: number;
    color: string;
    opacity: number;
}
