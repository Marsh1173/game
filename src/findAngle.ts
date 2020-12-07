import { Vector } from "./vector";

export function findAngle(position1: Vector, position2: Vector): number {
    let angle: number = Math.atan((position2.y - position1.y) / (position2.x - position1.x));
    return (position2.x - position1.x < 0) ? angle + Math.PI : angle;
}