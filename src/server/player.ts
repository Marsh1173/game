import { config } from "../config";
import { Player, PlayerActions } from "../objects/player";
import { Vector } from "../vector";

const playerPositionList: Vector[] = [
    {
        x: config.xSize / 8,
        y: (config.ySize * 3) / 4 - config.playerSize,
    },
    {
        x: config.xSize / 8 + (((config.xSize * 3) / 4 - config.playerSize) * 1) / (config.playerCount - 1),
        y: (config.ySize * 3) / 4 - config.playerSize,
    },
    {
        x: config.xSize / 8 + (((config.xSize * 3) / 4 - config.playerSize) * 2) / (config.playerCount - 1),
        y: (config.ySize * 3) / 4 - config.playerSize,
    },
    {
        x: config.xSize / 8 + (((config.xSize * 3) / 4 - config.playerSize) * 3) / (config.playerCount - 1),
        y: (config.ySize * 3) / 4 - config.playerSize,
    },
    {
        x: config.xSize / 8 + (((config.xSize * 3) / 4 - config.playerSize) * 4) / (config.playerCount - 1),
        y: (config.ySize * 3) / 4 - config.playerSize,
    },
    {
        x: config.xSize / 8 + (((config.xSize * 3) / 4 - config.playerSize) * 5) / (config.playerCount - 1),
        y: (config.ySize * 3) / 4 - config.playerSize,
    },
];
const playerColorList: string[] = ["FireBrick", "Navy", "OliveDrab", "orchid", "Turquoise", "Orange"];

export class ServerPlayer extends Player {
    private static nextId = 0;

    public actionList: PlayerActions[] = [];

    constructor(doBlast: (position: Vector, color: string) => void) {
        super(
            ServerPlayer.nextId,
            playerPositionList[ServerPlayer.nextId],
            { x: 0, y: 0 },
            playerColorList[ServerPlayer.nextId],
            { width: config.playerSize, height: config.playerSize },
            0,
            0,
            true,
            false,
            false,
            false,
            100,
            150,
            doBlast,
        );
        ServerPlayer.nextId++;
    }
}
