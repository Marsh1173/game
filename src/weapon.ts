import { assetManager } from "./client/assetmanager";
import { findAngle } from "./findAngle";
import { DamageType, Player } from "./objects/player";

export type Weapon = "none" | "dagger" | "staff" | "hammer" | "axe" | "bow";

export const WeaponBasicAttack: Record<Weapon, (player: Player, players: Player[], basicAttackFunction: Function) => void> = {
    "none": (originalPlayer, players) => {
        
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2}, originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 5, "melee", angle, 100, Math.PI / 4, 10, 100);
    },
    "dagger": (originalPlayer, players) => {
        
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2}, originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 6 + originalPlayer.AttackModifier, "melee", angle, 100, Math.PI / 6, 10, 300);
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
        
        player.revealStealthed(100);
        player.moveSpeedModifier /= 1.5;
        setTimeout(() => {
            player.moveSpeedModifier *= 1.5;
        }, 700);
    },
    "hammer": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2},originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 13 + originalPlayer.AttackModifier * 2, "melee", angle, 150, Math.PI / 2, 30, 500);
    },
    "axe": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2},originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 10 + originalPlayer.AttackModifier, "melee", angle, 100, Math.PI / 8, 5, 100);
    },
    "bow": (player, players, basicAttackFunction) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},player.focusPosition);
        basicAttackFunction(
            "arrow",
            "ranged",
            10 + player.AttackModifier * 2,
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
        
        
        player.revealStealthed(100);
        player.moveSpeedModifier /= 2;
        setTimeout(() => {
            player.moveSpeedModifier *= 2;
        }, 500);
    },
}

function basicAttackTemplate(
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

/*class WeaponClass {
    weapon: Weapon;
    damage: number;
    damageType: DamageType;
    range: number;
    spread: number;
    meleeRange: number;
    knockback: number;

    constructor(weapon: Weapon,
        damage: number,
        damageType: DamageType,
        range: number,
        spread: number,
        meleeRange: number,
        knockback: number,) {
            this.weapon = weapon;
            this.damage = damage;
            this.damageType = damageType;
            this.range = range;
            this.spread = spread;
            this.meleeRange = meleeRange;
            this.knockback = knockback;
        }
}

export const WeaponTypes = {
    None: new WeaponClass("none", 5, "melee", 100, Math.PI / 4, 10, 100),
    Dagger: new WeaponClass("dagger", 6, "melee", 100, Math.PI / 6, 10, 300),
    Staff: new WeaponClass("staff", 0, "magic", 0, 0, 0, 0),
    Hammer: new WeaponClass("hammer", 13, "melee", 150, Math.PI / 2, 30, 500),
    Axe: new WeaponClass("axe", 8, "melee", 150, Math.PI / 4, 5, 50),
    Bow: new WeaponClass("bow", 0, "ranged", 0, 0, 0, 0),
}

export const WeaponTypeBasicAttack: Record<WeaponClass["weapon"], (player: Player, players: Player[], basicAttackFunction: Function) => void> = {
    "none": (originalPlayer, players) => {
        
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2}, originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 5, "melee", angle, 100, Math.PI / 4, 10, 100);
    },
    "dagger": (originalPlayer, players) => {
        
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2}, originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 6 + originalPlayer.AttackModifier, "melee", angle, 100, Math.PI / 6, 10, 300);
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
        
        player.revealStealthed(100);
        player.moveSpeedModifier /= 1.5;
        setTimeout(() => {
            player.moveSpeedModifier *= 1.5;
        }, 700);
    },
    "hammer": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2},originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 13 + originalPlayer.AttackModifier * 2, "melee", angle, 150, Math.PI / 2, 30, 500);
    },
    "axe": (originalPlayer, players) => {
        const angle: number = findAngle({x: originalPlayer.position.x + originalPlayer.size.width / 2, y: originalPlayer.position.y + originalPlayer.size.height / 2},originalPlayer.focusPosition);
        basicAttackTemplate(originalPlayer, players, 10 + originalPlayer.AttackModifier, "melee", angle, 100, Math.PI / 8, 5, 100);
    },
    "bow": (player, players, basicAttackFunction) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},player.focusPosition);
        basicAttackFunction(
            "arrow",
            "ranged",
            10 + player.AttackModifier * 2,
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
        
        
        player.revealStealthed(100);
        player.moveSpeedModifier /= 2;
        setTimeout(() => {
            player.moveSpeedModifier *= 2;
        }, 500);
    },
}*/