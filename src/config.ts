import { Vector } from "./vector";

const xSize: number = 4000;
const ySize: number = 1000;

export interface Config {
    /**
     * Decides player height and width
     */
    playerSize: Vector;
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
    playerSize: {x: 48, y: 50},
    playerStart: {
        x: 300,
        y: 650
    },
    blastRadius: 180,
    blastDuration: 0.15,
    blastPower: 300000,
    playerJumpHeight: 1050,
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
    standingSidewaysAcceleration: 15000,
    nonStandingSidewaysAcceleration: 2000,
    maxSidewaysMomentum: 2000,
    arrowPower: 2000,
    gameSpeed: 1,
};
