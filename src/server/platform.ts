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
                height: 50,
                width: 3500,
            },
            {
                x: 250,
                y: 750,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 200,
                width: 50,
            },
            {
                x: 250,
                y: 560,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 200,
                width: 50,
            },
            {
                x: 3700,
                y: 560,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 30,
                width: 500,
            },
            {
                x: 1750,
                y: 610,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 150,
                width: 40,
            },
            {
                x: 1980,
                y: 610,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 500,
                width: 30,
            },
            {
                x: 1500,
                y: 0,
            },
            config,
        ),
        new ServerPlatform(
            {
                height: 500,
                width: 30,
            },
            {
                x: 2470,
                y: 0,
            },
            config,
        ),
    ];
};
