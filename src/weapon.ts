import { assetManager, ImageName } from "./client/assetmanager";
import { findAngle } from "./findAngle";
import { DamageType, Player } from "./objects/player";
import { AbilityType } from "./objects/abilities";

export type Weapon = "none" | "dagger" | "staff" | "hammer" | "axe" | "bow";

export const WeaponBasicAttack: Record<Weapon, (player: Player, players: Player[], basicAttackFunction: Function) => void> = {
    "none": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2}, originalPlayer.focusPosition);
        sweepingBasicAttackTemplate(originalPlayer, players, 5, "melee", angle, 100, Math.PI / 4, 10, 100);
    },
    "dagger": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2}, originalPlayer.focusPosition);
        sweepingBasicAttackTemplate(originalPlayer, players, 7, "melee", angle, 75, Math.PI / 8, 15, 50);
    },
    "staff": (player, players, basicAttackFunction) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},player.focusPosition);
        basicAttackFunction(
            "fire",
            "magic",
            15 + player.AttackModifier,
            player.id,
            player.team,
            { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2 },
            { x: 1200 * Math.cos(angle), y: 1200 * Math.sin(angle) },
            0,
            0,
            0,
            0.5 + player.AttackModifier /  50,
            false,
        );
    },
    "hammer": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2},originalPlayer.focusPosition);
        sweepingBasicAttackTemplate(originalPlayer, players, 13 + originalPlayer.AttackModifier * 2, "melee", angle, 150, Math.PI / 2, 30, 500);
    },
    "axe": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2},originalPlayer.focusPosition);
        sweepingBasicAttackTemplate(originalPlayer, players, 1 + originalPlayer.AttackModifier, "melee", angle, 100, Math.PI / 8, 5, 100);//damage lowered for testing purposes
    },
    "bow": (player, players, basicAttackFunction) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},player.focusPosition);
        basicAttackFunction(
            "arrow",
            "ranged",
            1 + player.AttackModifier * 2, //lowered for testing purposes
            player.id,
            player.team,
            { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2 },
            { x: 1200 * Math.cos(angle), y: 900 * Math.sin(angle) - 150},
            0.15,
            200,
            0,
            0.7 + player.AttackModifier * 50,
            false,
        );
        
        player.animationFrame = 1;
    },
}

function sweepingBasicAttackTemplate(
    originalPlayer: Player,
    players: Player[],
    damage: number,
    damageType: DamageType,
    angle: number,
    range: number,
    spread: number,
    meleeRange: number,
    knockback: number,
) {

    originalPlayer.animationFrame = 1;

    players.forEach((player) => {

        if (!player.effects.isShielded && !player.isDead && player.team != originalPlayer.team) {
    
            const distance = Math.sqrt(Math.pow((player.position.x - originalPlayer.position.x), 2) + Math.pow((player.position.y - originalPlayer.position.y), 2));
            const enemyAngle: number = findAngle({x: (originalPlayer.position.x + originalPlayer.size.width / 2), y: (originalPlayer.position.y + originalPlayer.size.height / 2)},
                            {x: (player.position.x + player.size.width / 2), y: (player.position.y + player.size.height / 2)});

            if (distance < range) {
                if (
                    (enemyAngle > angle - spread / 2 && enemyAngle < angle + spread / 2) ||
                    (enemyAngle > angle - spread / 2 + Math.PI * 2 && enemyAngle < angle + spread / 2 + Math.PI * 2) ||
                    (enemyAngle > angle - spread / 2 - Math.PI * 2 && enemyAngle < angle + spread / 2 - Math.PI * 2) ||
                    distance < meleeRange
                ) {
                    if (originalPlayer.weaponEquipped === "dagger") {
                        player.dotPlayer(2 + originalPlayer.AttackModifier / 2, originalPlayer.id, originalPlayer.team, "magic", 250, 10);
                        if ((player.facing && angle >= Math.PI / -2 && angle <= Math.PI / 2) || (!player.facing && angle >= Math.PI / 2 && angle <= (Math.PI * 3) / 2)) {
                            (originalPlayer.effects.isStealthed) ? damage *= 3 : damage *= 1.3;
                        }
                    }

                    player.damagePlayer(damage, originalPlayer.id, originalPlayer.team, damageType);
                    player.knockbackPlayer(angle, knockback);
                    originalPlayer.revealStealthed(20);
                }
            }
        }
    });
}

export function getWeaponIcon(weapon: Weapon): ImageName {
    switch (weapon) {
        case "none" :
            return "fistIcon";
        case "hammer" :
            return "hammerIcon";
        case "dagger" :
            return "poisonedSwordIcon";
        case "staff" :
            return "staffIcon";
        case "axe" :
            return "axeIcon";
        case "bow" :
            return "bowIcon";
        default :
            return "fistIcon";

    }
}

export function getWeaponStats(weapon: Weapon): AbilityType {
    switch (weapon) {
        case "none" :
            return {abilityCastReq: "onClickRepeat", cooldownReq: 0.3, chargeReq: 0,};
        case "hammer" :
            return {abilityCastReq: "onClickRepeat", cooldownReq: 0.1, chargeReq: 0,};
        case "dagger" :
            return {abilityCastReq: "onClickRepeat", cooldownReq: 0.3, chargeReq: 0,};
        case "staff" :
            return {abilityCastReq: "onChargeRepeat", cooldownReq: 0.1, chargeReq: 0.4,};
        case "axe" :
            return {abilityCastReq: "onClickRepeat", cooldownReq: 0.4, chargeReq: 0,};
        case "bow" :
            return {abilityCastReq: "onChargeRepeat", cooldownReq: 0.1, chargeReq: 0.5,};
        default :
            return {abilityCastReq: "onClickRepeat", cooldownReq: 1, chargeReq: 0,};
    }
}