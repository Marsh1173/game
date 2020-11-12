import { config } from "../config";
import { Player, PlayerActions } from "../objects/player";
import { Vector } from "../vector";

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    var colorsOdd = "";
    for (var i = 0; i < 2; i++) {
      colorsOdd += letters[Math.floor(Math.random() * 16)];
    }
    var variation = Math.floor(Math.random() * 6)
    switch (variation) {
        case 0 :
            color += colorsOdd + "00" + colorsOdd;
            break;
        case 1 :
            color += colorsOdd + colorsOdd + "00";
            break;
        case 2 :
            color += "00" + colorsOdd + colorsOdd;
            break;
        case 3 :
            color += "00" + colorsOdd + colorsOdd;
            break;
        case 4 :
            color += colorsOdd + "00" + colorsOdd;
            break;
        case 5 :
            color += colorsOdd + colorsOdd + "00";
            break;
        default:
            color = "#000000"

    }
    return color;
}

export class ServerPlayer extends Player {
    private static nextId = 0;

    public actionList: PlayerActions[] = [];

    constructor(doBlast: (position: Vector, color: string, id: number) => void) {
        super(
            ServerPlayer.nextId,
            {
                x: config.xSize / 8,
                y: (config.ySize * 3) / 4 - config.playerSize,
            },
            { x: 0, y: 0 },
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
            doBlast,
        );
        ServerPlayer.nextId++;
    }
}
