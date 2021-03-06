import { ClassType } from "../classtype";
import { Item } from "../objects/item";
import { Player } from "../objects/player";
import { Size } from "../size";
import { Vector } from "../vector";
import { assetManager } from "./assetmanager";

export const playerRenderData: Record<ClassType, (ctx: CanvasRenderingContext2D, player: Player) => void> = {
    "ninja": (ctx, player) => {
        //headband
        ctx.shadowBlur = 0;
        ctx.fillStyle = "black";
        ctx.fillRect(player.position.x, player.position.y + 4, player.size.width, player.size.height - 40);

        //loose headband piece
        let xStart: number = player.position.x + player.size.width - 2;
        if (player.facing) xStart = player.position.x + 2;

        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(xStart, player.position.y + 7);
        ctx.lineTo(xStart - player.momentum.x / 60 + 2, player.position.y + 20 - player.momentum.y / 100);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xStart, player.position.y + 7);
        ctx.lineTo(xStart - player.momentum.x / 70 - 2, player.position.y + 30 - player.momentum.y / 100);
        ctx.stroke();

        //reset
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    },
    "wizard": (ctx, player) => {
        ctx.shadowBlur = 0;

        const imagePosition: Vector = {
            x: player.position.x + player.size.width * 0.15,
            y: player.position.y - player.size.height * 1.0,
        };
        const imageSize: Size = {
            width: player.size.width * 1.1,
            height: player.size.height * 1.1,
        };
        const rotation = 0.3;
        ctx.save();
        ctx.translate(imagePosition.x, imagePosition.y);
        ctx.rotate(rotation);
        ctx.translate(-imagePosition.x, -imagePosition.y);
        ctx.drawImage(assetManager.images["wizard-hat"], imagePosition.x, imagePosition.y, imageSize.width, imageSize.height);
        ctx.restore();

        //reset
        ctx.shadowBlur = 2;
        ctx.shadowColor = "gray";
    },
    "warrior": (ctx, player) => {
        ctx.shadowBlur = 0;

        //scarf
        ctx.fillStyle = "mediumblue";
        ctx.fillRect(player.position.x, player.position.y + player.size.height / 2, player.size.width, -10);

        //loose scarf piece
        let xStart: number = player.position.x + player.size.width - 3;
        if (player.facing) xStart = player.position.x + 3;

        ctx.strokeStyle = "mediumblue";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(xStart, player.position.y + player.size.height / 2 - 6);
        ctx.lineTo(xStart - player.momentum.x / 60, player.position.y + player.size.height / 2 + 10 - player.momentum.y / 80);
        ctx.stroke();

        //reset
        ctx.shadowBlur = 2;
    },
    "axeai": (ctx, player) => {
        
    },
    "archerai": (ctx, player) => {
        
    },
}

export const playerRenderFirstAbilityPointer: Record<ClassType, (ctx: CanvasRenderingContext2D) => void> = {
    "ninja": (ctx) => {},
    "wizard": (ctx) => {},
    "warrior": (ctx) => {},
    "axeai": (ctx) => {},
    "archerai": (ctx) => {},
}

export function renderPlayerOrItemFocus(ctx: CanvasRenderingContext2D, player: Player, items: Item[]) {

    let targetItem: Item | undefined;
    let targetItemDistanceFromCursor: number | undefined;
    
    items.forEach((item) => {
        const distanceFromCursor: number = Math.sqrt(Math.pow(item.position.x + item.itemSize / 2 - player.focusPosition.x, 2) + Math.pow(item.position.y + item.itemSize / 2 - player.focusPosition.y, 2));
        if ((!targetItem && distanceFromCursor < 20) || (targetItem && targetItemDistanceFromCursor && distanceFromCursor < targetItemDistanceFromCursor)) {
            
            targetItem = item;
            targetItemDistanceFromCursor = distanceFromCursor;
        }
    });
    if (targetItem && Math.sqrt(Math.pow(targetItem.position.x + targetItem.itemSize / 2 - player.position.x - player.size.width / 2, 2) + Math.pow(targetItem.position.y + targetItem.itemSize / 2 - player.position.y - player.size.height / 2, 2)) < 150) {
        ctx.save()
        ctx.fillStyle = "cyan";
        ctx.shadowBlur = 2;
        ctx.shadowColor = "black";
        ctx.beginPath();
        ctx.moveTo(targetItem.position.x, targetItem.position.y);
        ctx.lineTo(targetItem.position.x, targetItem.position.y + 5);
        ctx.lineTo(targetItem.position.x + 5, targetItem.position.y);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(targetItem.position.x + targetItem.itemSize, targetItem.position.y);
        ctx.lineTo(targetItem.position.x + targetItem.itemSize, targetItem.position.y + 5);
        ctx.lineTo(targetItem.position.x + targetItem.itemSize - 5, targetItem.position.y);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(targetItem.position.x, targetItem.position.y + targetItem.itemSize);
        ctx.lineTo(targetItem.position.x, targetItem.position.y + targetItem.itemSize - 5);
        ctx.lineTo(targetItem.position.x + 5, targetItem.position.y + targetItem.itemSize);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(targetItem.position.x + targetItem.itemSize, targetItem.position.y + targetItem.itemSize);
        ctx.lineTo(targetItem.position.x + targetItem.itemSize, targetItem.position.y + targetItem.itemSize - 5);
        ctx.lineTo(targetItem.position.x + targetItem.itemSize - 5, targetItem.position.y + targetItem.itemSize);
        ctx.fill();
        ctx.restore();
    }
}