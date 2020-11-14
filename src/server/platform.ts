import { config } from "../config";
import { Platform } from "../objects/platform";
import { Size } from "../size";
import { Vector } from "../vector";

export class ServerPlatform extends Platform {
    constructor(size: Size, position: Vector) {
        super(size, position);
    }

    public update() {}
}

export const defaultPlatformList = [
    new ServerPlatform(
        {
            height: 25,
            width: (config.xSize * 3) / 4,
        },
        {
            x: config.xSize / 8,
            y: (config.ySize * 3) / 4,
        },
    ),
    new ServerPlatform(
        {
            height: 25,
            width: (config.xSize * 3) / 8,
        },
        {
            x: config.xSize / 8 + (config.xSize * 3) / 4 / 4,
            y: config.ySize / 2,
        },
    ),
    new ServerPlatform(
        {
            height: 25,
            width: config.xSize * 3 / 8,
        },
        {
            x: (config.xSize * 3) / 4,
            y: config.ySize / 4,
        },
    ),
    new ServerPlatform(
        {
            height: 25,
            width: config.xSize * 3 / 8,
        },
        {
            x: (config.xSize * -1) / 8,
            y: config.ySize / 4,
        },
    ),
];
