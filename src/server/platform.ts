import { Config } from "../config";
import { Platform } from "../objects/platform";
import { Size } from "../size";
import { Vector } from "../vector";

export class ServerPlatform extends Platform {
    constructor(size: Size, position: Vector, config: Config) {
        super(size, position, config);
    }

    public update() {}
}

export const getDefaultPlatformList = (config: Config) => {
    return [
        new ServerPlatform(
            {
                height: 25,
                width: (config.xSize * 3) / 4,
            },
            {
                x: config.xSize / 8,
                y: (config.ySize * 3) / 4 + 30,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 20,
                width: (config.xSize * 3) / 8,
            },
            {
                x: config.xSize / 8 + (config.xSize * 3) / 16,
                y: config.ySize * 11 / 20 + 20,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 20,
                width: (config.xSize * 3) / 8,
            },
            {
                x: (config.xSize * 3) / 4,
                y: config.ySize * 2 / 5 - 20,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 20,
                width: (config.xSize * 3) / 8,
            },
            {
                x: (config.xSize * -1) / 8,
                y: config.ySize * 2 / 5 - 20,
            },
            config,
        ),
    ];
};
