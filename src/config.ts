import { Vector } from "./vector";

const xSize: number = 3000;
const ySize: number = 600;

export interface Config {
    /**
     * Decides player height and width
     */
    playerSize: number;
    playerStart: Vector;
    blastRadius: number;
    blastDuration: number;
    blastPower: number;
    playerJumpHeight: number;
    blastCooldown: number;
    xSize: number;
    ySize: number;
    playerKeys: {
        up: string;
        down: string;
        left: string;
        right: string;
        basicAttack: string,
        secondAttack: string,
    };
    platformColor: string;
    fallingAcceleration: number;
    standingSidewaysAcceleration: number;
    nonStandingSidewaysAcceleration: number;
    maxSidewaysMomentum: number;
    arrowPower: number;
    gameSpeed: number;
}

export const defaultConfig: Config = {
    playerSize: 50,
    playerStart: {
        x: xSize / 8 + (xSize * 3) / 16,
        y: ySize * 11 / 20 - 30
    },
    blastRadius: 180,
    blastDuration: 0.15,
    blastPower: 300000,
    playerJumpHeight: 1000,
    blastCooldown: 20,
    xSize,
    ySize,
    playerKeys: {
        up: "KeyW",
        down: "KeyS",
        left: "KeyA",
        right: "KeyD",
        basicAttack: "leftMouseDown",
        secondAttack: "rightMouseDown",
    },
    platformColor: "grey",
    fallingAcceleration: 3500,
    standingSidewaysAcceleration: 13000,
    nonStandingSidewaysAcceleration: 2000,
    maxSidewaysMomentum: 900,
    arrowPower: 2000,
    gameSpeed: 1,
};
