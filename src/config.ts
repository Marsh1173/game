export interface Config {
    /**
     * Decides player height and width
     */
    playerSize: number;
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
    };
    platformColor: string;
    fallingAcceleration: number;
    standingSidewaysAcceleration: number;
    nonStandingSidewaysAcceleration: number;
    maxSidewaysMomentum: number;
    arrowPower: number;
}

export const defaultConfig: Config = {
    playerSize: 50,
    blastRadius: 180,
    blastDuration: 0.15,
    blastPower: 300000,
    playerJumpHeight: 1000,
    blastCooldown: 20,
    xSize: 3000,
    ySize: 600,
    playerKeys: {
        up: "KeyW",
        down: "KeyS",
        left: "KeyA",
        right: "KeyD",
    },
    platformColor: "grey",
    fallingAcceleration: 3500,
    standingSidewaysAcceleration: 13000,
    nonStandingSidewaysAcceleration: 2000,
    maxSidewaysMomentum: 900,
    arrowPower: 2000,
};
