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
        ),new ServerPlatform(
            {
                height: 30,
                width: 400,
            },
            {
                x: 1000,
                y: 580,
            },
            config,
        ),new ServerPlatform(
            {
                height: 30,
                width: 800,
            },
            {
                x: 1600,
                y: 580,
            },
            config,
        ),new ServerPlatform(
            {
                height: 30,
                width: 400,
            },
            {
                x: 2600,
                y: 580,
            },
            config,
        ),new ServerPlatform(
            {
                height: 30,
                width: 850,
            },
            {
                x: 1000,
                y: 410,
            },
            config,
        ),new ServerPlatform(
            {
                height: 30,
                width: 850,
            },
            {
                x: 2150,
                y: 410,
            },
            config,
        ),new ServerPlatform(
            {
                height: 30,
                width: 1000,
            },
            {
                x: 1500,
                y: 240,
            },
            config,
        ),

        new ServerPlatform(
            {
                height: 300,
                width: 40,
            },
            {
                x: 1000,
                y: 360,
            },
            config,
        ),new ServerPlatform(
            {
                height: 300,
                width: 40,
            },
            {
                x: 2960,
                y: 360,
            },
            config,
        ),new ServerPlatform(
            {
                height: 320,
                width: 40,
            },
            {
                x: 1500,
                y: 0,
            },
            config,
        ),new ServerPlatform(
            {
                height: 320,
                width: 40,
            },
            {
                x: 2460,
                y: 0,
            },
            config,
        ),new ServerPlatform(
            {
                height: 200,
                width: 40,
            },
            {
                x: 1980,
                y: 580,
            },
            config,
        ),
    ];
};
