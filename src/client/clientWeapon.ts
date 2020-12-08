import { Player } from "../objects/player";
import { Weapon } from "../weapon";
import { assetManager } from "./assetmanager";
import { findAngle } from "../findAngle";


export const WeaponRender: Record<Weapon, (player: Player, ctx: CanvasRenderingContext2D) => void> = {
    "none": () => {},
    "dagger": (player, ctx) => {
        interpretAnimationFrame(ctx, assetManager.images["dagger"], player, 0.14, 30, 27, 0.666, 0.75);
    },
    "staff": (player, ctx) => {
        interpretAnimationFrame(ctx, assetManager.images["staff"], player, 0.19, 40, 35, 0.666, 0.75);
    },
    "hammer": (player, ctx) => {
        interpretAnimationFrame(ctx, assetManager.images["hammer"], player, 0.25, 40, 35, 0.74, 0.75);
    },
    "axe": (player, ctx) => {
        interpretAnimationFrame(ctx, assetManager.images["axe"], player, 0.19, 30, 27, 0.74, 0.85);
    },
    "bow": (player, ctx) => {
        interpretAnimationFrame(ctx, assetManager.images["bow"], player, 0.2, 10, 10, 0.1, 0.85);
    },
}

function interpretAnimationFrame(ctx: CanvasRenderingContext2D, img: HTMLImageElement, player: Player, scale: number, x: number, y: number, imagex: number, imagey: number) {

    let rotationFromPlayer: number = Math.atan((player.focusPosition.y - player.position.y - player.size.height / 2) / (player.focusPosition.x - player.position.x - player.size.width / 2));
    let weaponRotation: number = Math.atan((player.focusPosition.y - player.position.y - player.size.height / 2) / (player.focusPosition.x - player.position.x - player.size.width / 2));

    
    if (player.focusPosition.x - player.position.x - player.size.width / 2 < 0) {
        scale *= -1;
        rotationFromPlayer *= -1;
        weaponRotation *= -1;
        x *= -1;
    }

    const frame: number = player.animationFrame;
    
    switch (Math.floor(frame)) {
        case 1 : // basic attack animation
            if (player.weaponEquipped === "bow") {
                x *= (frame - 0.5) / 1.5;
                y *= (frame - 0.5) / 1.5;
            } else {
                weaponRotation -= Math.pow((frame - 1.1), 3) * 3 - 1.5;
                x *= (Math.pow(frame - 1, 2) - 1) / -4 + 1;
                y *= (Math.pow(frame - 1, 2) - 1) / -4 + 1;
                rotationFromPlayer -= (Math.pow(frame - 1, 2) - 1) / 3;
            }
            break;
        case 3 : // secondary attack?
            break;
    }

    renderWeaponTemplate(ctx, img, player, scale, x, y, imagex, imagey, rotationFromPlayer, weaponRotation);
}

function renderWeaponTemplate(ctx: CanvasRenderingContext2D, img: HTMLImageElement, player: Player,
    scale: number, // multiplied by original size of image. 0.18 average.
    x: number, // x in relation to the player
    y: number, // y in relation to the player
    imagex: number, // 0-1.0 deciding where the pivot point is for image
    imagey: number,
    rotationFromPlayer: number,
    weaponRotation: number
    ) {

    ctx.save()
    ctx.shadowBlur = 0;

    ctx.transform(scale,0,0,Math.abs(scale),
        player.position.x + player.size.width / 2 + x * Math.cos(rotationFromPlayer),
        player.position.y + player.size.height / 2 + y * Math.sin(rotationFromPlayer),
    );

    ctx.rotate(weaponRotation + Math.PI / 4);
    ctx.drawImage(img, -img.width * imagex, -img.height * imagey);

    ctx.restore();
}