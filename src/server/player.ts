import { config } from "../config";
import { Player, PlayerActions } from "../objects/player";
import { Vector } from "../vector";

var colors: string[] = [
    "aqua", "aquamarine", "blue", "blueviolet", "brown", "cadetblue", "cornflowerblue", "crimson", "cyan", "darkblue", "darkcyan", "darkgreen", "darkmagenta", "darkolivegreen", "darkorange", "darkred", "darkslategray", "darkviolet", "deepskyblue", "dodgerblue", "firebrick", "forestgreen", "goldenrod", "green", "orange", "rebeccapurple", "seagreen", "teal", "steelblue",
];

function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

export class ServerPlayer extends Player {
    private static nextId = 0;

    public actionList: PlayerActions[] = [];

    constructor(doBlast: (position: Vector, color: string, id: number) => void, doArrow: (position: Vector, momentum: Vector, id: number) => void) {
        super(
            ServerPlayer.nextId,
            "Player " + (ServerPlayer.nextId + 1),
            0,
            0,
            {
                x: config.xSize / 8,
                y: (config.ySize * 3) / 4 - config.playerSize,
            },
            { x: 0, y: 0 },
            //config.playerColor,
            getRandomColor(),
            { width: config.playerSize, height: config.playerSize },
            0,
            0,
            true,
            false,
            false,
            false,
            100,
            150,
            -1,
            0,
            {
                x: 0,
                y: 0,
            },
            0,
            false,
            false,
            true,
            doBlast,
            doArrow,
        );
        ServerPlayer.nextId++;
        //config.playerName = "Player " + (ServerPlayer.nextId + 1);
    }
}
