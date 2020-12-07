import { Vector } from "./vector";

const xSize: number = 4000;
const ySize: number = 1000;

export interface Config {
    /**
     * Decides player height and width
     */
    playerSize: Vector;
    playerStart: Vector;
    playerJumpHeight: number;
    xSize: number;
    ySize: number;
    playerKeys: {
        up: string;
        down: string;
        left: string;
        right: string;
        basicAttack: string,
        secondAttack: string,
        firstAbility: string,
        secondAbility: string,
        thirdAbility: string,
        fourthAbility: string,
    };
    platformColor: string;
    fallingAcceleration: number;
    standingSidewaysAcceleration: number;
    nonStandingSidewaysAcceleration: number;
    maxSidewaysMomentum: number;
    gameSpeed: number;
}

export const defaultConfig: Config = {
    playerSize: {x: 48, y: 50},
    playerStart: {
        x: 300,
        y: 650
    },
    playerJumpHeight: 800,
    xSize,
    ySize,
    playerKeys: {
        up: "KeyW",
        down: "KeyS",
        left: "KeyA",
        right: "KeyD",
        basicAttack: "leftMouseDown",
        secondAttack: "rightMouseDown",
        firstAbility: "ShiftLeft",
        secondAbility: "Space",
        thirdAbility: "KeyQ",
        fourthAbility: "KeyE",
    },
    platformColor: "grey",
    fallingAcceleration: 3500,
    standingSidewaysAcceleration: 15000,
    nonStandingSidewaysAcceleration: 2000,
    maxSidewaysMomentum: 2000,
    gameSpeed: 1,
};
