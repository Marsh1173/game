import { ImageName } from "../client/assetmanager";
import { findAngle } from "../findAngle";
import { getWeaponStats, Weapon } from "../weapon";
import { Platform } from "./platform";
import { Player, PlayerAbilityType } from "./player";

export type PlayerAbilities = "basicAttack" | "secondaryAttack" | "firstAbility" | "secondAbility" | "thirdAbility";
export type AbilityName = "none" | "basicAttack" | "shurikenToss" | "stealth" | "blizzard" | "meteorStrike" | "iceShard" | "healingAura" | "chains" | "shieldSlam" | "charge";
export type AbilityCastReq = "onClick" | "onClickRepeat" | "onCharge" | "onChargeRepeat" | "onRelease";

export type AbilityType = {
    abilityCastReq: AbilityCastReq,
    cooldownReq: number,
    chargeReq: number,
}

export function updateAndCheckAbilites(elapsedTime: number, player: Player, ability: PlayerAbilityType, whichAbility: PlayerAbilities) {
    if (ability.abilityName === "none") return;

    if ((((ability.abilityType.abilityCastReq === "onClick" || ability.abilityType.abilityCastReq === "onClickRepeat") && ability.isCharging === true) || 
    ((ability.abilityType.abilityCastReq === "onCharge" || ability.abilityType.abilityCastReq === "onChargeRepeat") && ability.isCharging === true && ability.chargeAmount >= ability.abilityType.chargeReq) || 
    ((ability.abilityType.abilityCastReq === "onRelease") && ability.isCharging === false && ability.chargeAmount >= ability.abilityType.chargeReq)) &&
    ability.cooldown <= 0) { // if it meets the requirements for its type

        //console.log(ability.abilityName);
        
        switch (whichAbility) {
            case "basicAttack" : 
                player.actionsNextFrame.basicAttack = true;
                break;
            case "secondaryAttack" : 
                player.actionsNextFrame.secondaryAttack = true;
                break;
            case "firstAbility" : 
                player.actionsNextFrame.firstAbility = true;
                break;
            case "secondAbility" : 
                player.actionsNextFrame.secondAbility = true;
                break;
            case "thirdAbility" : 
                player.actionsNextFrame.thirdAbility = true;
                break;
            default: console.log("Ability update error!");
        }
        
        if (ability.abilityType.abilityCastReq != "onChargeRepeat" && ability.abilityType.abilityCastReq != "onClickRepeat")
            ability.isCharging = false;
        ability.cooldown = ability.abilityType.cooldownReq;
        ability.chargeAmount = 0;

    } else if (ability.isCharging && ability.abilityType.abilityCastReq != "onClick" && ability.abilityType.abilityCastReq != "onClickRepeat" && ability.cooldown <= 0) {
        ability.chargeAmount += elapsedTime;
    } else if (ability.chargeAmount != 0) {
        ability.chargeAmount = 0;
    }
        
    if (ability.cooldown > 0) ability.cooldown -= elapsedTime;
    else if (ability.cooldown < 0) ability.cooldown = 0;
}

export function cancelAbilites(player: Player) {
    player.playerAbilities[0].chargeAmount = 0;
    player.playerAbilities[1].chargeAmount = 0;
    player.playerAbilities[2].chargeAmount = 0;
    player.playerAbilities[3].chargeAmount = 0;
    player.playerAbilities[4].chargeAmount = 0;

    player.playerAbilities[0].isCharging = false;
    player.playerAbilities[1].isCharging = false;
    player.playerAbilities[2].isCharging = false;
    player.playerAbilities[3].isCharging = false;
    player.playerAbilities[4].isCharging = false;
}

export const AbilityCastFunction: Record<AbilityName, (player: Player, players: Player[], platforms: Platform[]) => void> = {
    "none": () => {},
    "basicAttack": () => {},
    "shurikenToss": (player) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2}, player.focusPosition);

        player.momentum.x += player.momentum.x / 2 - 800 * Math.cos(angle);
        player.momentum.y += player.momentum.y / 2 - 800 * Math.sin(angle);

        player.doProjectile(
            "shuriken",
            "ranged",
            7,
            player.id,
            player.team,
            { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2 },
            { x: 2500 * Math.cos(angle), y: 2500 * Math.sin(angle) },
            0.05,
            100,
            0,
            1,
            false,
        );
    },
    "stealth": (player) => {
        player.effects.isStealthed = true;
        player.stealthCount = setTimeout(() => {
            player.effects.isStealthed = false;
        }, 6500);
    },
    "blizzard": (player) => {
        player.doTargetedProjectile(
            "blizzard",
            player.id,
            player.team,
            { x: player.position.x + player.size.width / 2, y: player.position.y},
            { x: (player.facing) ? 75 : -75, y: 0 },
            {x: 0, y: 0},
            false,
            6,
        );
    },
    "meteorStrike": (player, players, platforms) => {
        let y = player.config.ySize;

        platforms.forEach((platform) => {
            if (
                platform.position.x < player.focusPosition.x - 4 &&
                platform.position.x + platform.size.width > player.focusPosition.x - 4 &&
                platform.position.y > player.focusPosition.y - 4
            ) {
                y = platform.position.y;
            }
        });

        player.doTargetedProjectile(
            "firestrike",
            player.id,
            player.team,
            { x: player.focusPosition.x - 4, y: y - player.config.ySize },
            { x: 0, y: 600 },
            { x: player.focusPosition.x - 4, y: y },
            false,
            40,
        );
    },
    "iceShard": (player) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2}, player.focusPosition);

        player.doProjectile(
            "ice",
            "ranged",
            15,
            player.id,
            player.team,
            { x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2 },
            { x: 1300 * Math.cos(angle), y: 1300 * Math.sin(angle) - 100 },
            0.15,
            1000,
            0,
            1,
            false,
        );

        player.moveSpeedModifier /= 2;
        setTimeout(() => {
            player.moveSpeedModifier *= 2;
        }, 200);
    },
    "healingAura": (player) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2}, player.focusPosition);

        player.doTargetedProjectile(
            "healingAura",
            player.id,
            player.team,
            {x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2},
            { x: Math.cos(angle) * 50, y: Math.sin(angle) * 50 },
            { x: player.position.x + Math.cos(angle) * 500, y: player.position.y + Math.sin(angle) * 500 },
            //{x: this.position.x, y: this.position.y},
            false,
            3,
        );
    },
    "chains": (player) => {
        const angle: number = findAngle({x: player.position.x + player.size.width / 2, y: player.position.y + player.size.height / 2}, player.focusPosition);

        player.doTargetedProjectile(
            "chains",
            player.id,
            player.team,
            { x: player.position.x + Math.cos(angle) * 500, y: player.position.y + Math.sin(angle) * 500 },
            { x: 0, y: 0 },
            player.position,
            false,
            1,
        );
    },
    "shieldSlam": (originalPlayer, players) => {
    },
    "charge": (player, players) => {
        const xRange: number = 400;
        const yRange: number = 50;

        player.momentum.x = 0;
        player.momentum.y /= 3;
        (player.facing) ? player.pushPlayer(5, 0, 100) : player.pushPlayer(-5, 0, 100);

        players.forEach((player) => {
            if (player.team != player.team &&
                player.position.y > player.position.y - yRange && player.position.y < player.position.y + yRange &&
                ((player.facing && player.position.x > player.position.x - 25 && player.position.x < player.position.x + xRange) ||
                (!player.facing && player.position.x > player.position.x - xRange && player.position.x < player.position.x + 25))) {
                    setTimeout(() => {
                        player.damagePlayer(7, player.id, player.team, "crushing");
                        player.momentum.y -= 400; // knocks them slightly upwards

                        player.moveSpeedModifier /= 2; // slows them by half
                        setTimeout(() => {
                            player.moveSpeedModifier *= 2;
                        }, 1500);
                    }, 30);
            }
        });
    },
}

export function getAbilityStats(abilityName: AbilityName, weapon: Weapon): AbilityType {
    switch (abilityName) {
        case "none" :
            return {abilityCastReq: "onClick", cooldownReq: 1, chargeReq: 0,};
        case "basicAttack" :
            return getWeaponStats(weapon);
        case "shurikenToss" :
            return {abilityCastReq: "onClickRepeat", cooldownReq: 1, chargeReq: 0,};
        case "stealth" :
            return {abilityCastReq: "onCharge", cooldownReq: 1, chargeReq: 0.25,};
        case "blizzard" :
            return {abilityCastReq: "onRelease", cooldownReq: 1, chargeReq: 0.25,};
        case "meteorStrike" :
            return {abilityCastReq: "onRelease", cooldownReq: 1, chargeReq: 0.25,};
        case "iceShard" :
            return {abilityCastReq: "onChargeRepeat", cooldownReq: 1, chargeReq: 0.25,};
        case "healingAura" :
            return {abilityCastReq: "onRelease", cooldownReq: 1, chargeReq: 0.25,};
        case "chains" :
            return {abilityCastReq: "onClick", cooldownReq: 1, chargeReq: 0,};
        case "shieldSlam" :
            return {abilityCastReq: "onClick", cooldownReq: 1, chargeReq: 0,};
        case "charge" :
            return {abilityCastReq: "onClick", cooldownReq: 1, chargeReq: 0,};
        default :
            return {abilityCastReq: "onClick", cooldownReq: 1, chargeReq: 0,};
    }
}

export function getAbilityIcon(abilityName: AbilityName): ImageName {
    switch (abilityName) {
        case "none" :
            return "fistIcon";
        case "shurikenToss" :
            return "shurikenIcon";
        case "stealth" :
            return "stealthIcon";
        case "blizzard" :
            return "blizzardIcon";
        case "meteorStrike" :
            return "meteorStrikeIcon";
        case "iceShard" :
            return "iceIcon";
        case "healingAura" :
            return "healingAuraIcon";
        case "chains" :
            return "chainsIcon";
        case "shieldSlam" :
            return "shieldslamIcon";
        case "charge" :
            return "chargeIcon";
        default :
            return "fistIcon";
    }
}