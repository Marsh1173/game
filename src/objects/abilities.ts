import { Platform } from "./platform";
import { Player, PlayerAbilityClass } from "./player";


export type PlayerAbilities = "basicAttack" | "secondaryAttack" | "firstAbility" | "secondAbility" | "thirdAbility";
export type AbilityName = "none" | "basicAttack" | "shurikenToss" | "stealth" | "blizzard" | "meteorStrike" | "iceShard" | "healingAura" | "chains" | "shieldSlam" | "charge";
export type AbilityCastReqs = "onClick" | "onClickRepeat" | "onCharge" | "onChargeRepeat" | "onRelease";

class AbilityClass {
    abilityName: AbilityName;
    abilityCastReqs: AbilityCastReqs;
    cooldown: number;
    chargeReq: number;

    constructor(
        abilityName: AbilityName,
        abilityCastReqs: AbilityCastReqs,
        cooldown: number,
        chargeReq: number = 0,
        ) {
        this.abilityName = abilityName;
        this.abilityCastReqs = abilityCastReqs;
        this.cooldown = cooldown;
        this.chargeReq = chargeReq;
    }
}

const abilities: AbilityClass[] = [
    new AbilityClass ("none", "onClick", 1),
    new AbilityClass ("basicAttack", "onClickRepeat", 1),
    new AbilityClass ("shurikenToss", "onClickRepeat", 2.5),
    new AbilityClass ("stealth", "onCharge", 1, 0.25),
    new AbilityClass ("blizzard", "onRelease", 1, 0.25),
    new AbilityClass ("meteorStrike", "onRelease", 1, 0.25),
    new AbilityClass ("iceShard", "onChargeRepeat", 1, 0.3),
    new AbilityClass ("healingAura", "onRelease", 1, 0.25),
    new AbilityClass ("chains", "onClick", 1),
    new AbilityClass ("shieldSlam", "onClick", 1),
    new AbilityClass ("charge", "onClick", 1),
];

function findCorrespondingAbility(abilityName: AbilityName): AbilityClass {
    for (let i = 0; i < abilities.length; i++) {
        if (abilities[i].abilityName === abilityName) return abilities[i];
    }
    console.log("Error, couldn't find " + abilityName);
    return abilities[0];
}

export function updateAndCheckAbilites(elapsedTime: number, player: Player, ability: PlayerAbilityClass, whichAbility: PlayerAbilities) {
    if (whichAbility === "basicAttack") {
        updateAndCheckBasicAttack(elapsedTime, player, ability);
        return;
    } else if (ability.abilityName === "none") return;

    const abilityType: AbilityClass = findCorrespondingAbility(ability.abilityName);

    if ((((abilityType.abilityCastReqs === "onClick" || abilityType.abilityCastReqs === "onClickRepeat") && ability.isCharging === true) || 
    ((abilityType.abilityCastReqs === "onCharge" || abilityType.abilityCastReqs === "onChargeRepeat") && ability.isCharging === true && ability.chargeAmount >= abilityType.chargeReq) || 
    ((abilityType.abilityCastReqs === "onRelease") && ability.isCharging === false && ability.chargeAmount >= abilityType.chargeReq)) &&
    ability.cooldown <= 0) { // if it meets the requirements for any type

        //console.log(ability.abilityName);
        
        switch (whichAbility) {
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
        
        if (abilityType.abilityCastReqs != "onChargeRepeat" && abilityType.abilityCastReqs != "onClickRepeat") ability.isCharging = false;
        ability.cooldown = abilityType.cooldown;
        ability.chargeAmount = 0;
    } else if (ability.isCharging && abilityType.abilityCastReqs != "onClick" && abilityType.abilityCastReqs != "onClickRepeat" && ability.cooldown <= 0) {
        ability.chargeAmount += elapsedTime;
    } else if (ability.chargeAmount != 0) {
        ability.chargeAmount = 0;
    }
        
    if (ability.cooldown > 0) ability.cooldown -= elapsedTime;
    else if (ability.cooldown < 0) ability.cooldown = 0;
}

function updateAndCheckBasicAttack(elapsedTime: number, player: Player, ability: PlayerAbilityClass) {

    if (ability.cooldown <= 0 && ability.isCharging === true) player.actionsNextFrame.basicAttack = true;

    if (ability.cooldown > 0) ability.cooldown -= elapsedTime;
    else if (ability.cooldown < 0) ability.cooldown = 0;
}

export function cancelAbilites(player: Player) {
    player.abilities[0].chargeAmount = 0;
    player.abilities[1].chargeAmount = 0;
    player.abilities[2].chargeAmount = 0;
    player.abilities[3].chargeAmount = 0;
    player.abilities[4].chargeAmount = 0;

    player.abilities[0].isCharging = false;
    player.abilities[1].isCharging = false;
    player.abilities[2].isCharging = false;
    player.abilities[3].isCharging = false;
    player.abilities[4].isCharging = false;
}

export const AbilityFunction: Record<AbilityName, (player: Player, players: Player[], platforms: Platform[]) => void> = {
    "none": (originalPlayer, players) => {
        console.log("Tried to 'none' for their ability?");
    },
    "basicAttack": (originalPlayer, players) => {
        console.log("Tried to basic attack for their ability?");
    },
    "shurikenToss": (player) => {
        let newX: number = player.focusPosition.x - player.position.x - player.size.width / 2;
        let newY: number = player.focusPosition.y - player.position.y - player.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

        player.momentum.x += player.momentum.x / 2 - 1000 * Math.cos(angle);
        player.momentum.y += player.momentum.y / 2 - 1000 * Math.sin(angle);

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
        let newX: number = player.focusPosition.x - player.position.x - player.size.width / 2;
        let newY: number = player.focusPosition.y - player.position.y - player.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

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
        let newX: number = player.focusPosition.x - player.position.x - player.size.width / 2;
        let newY: number = player.focusPosition.y - player.position.y - player.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

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
        let newX: number = player.focusPosition.x - player.position.x - player.size.width / 2;
        let newY: number = player.focusPosition.y - player.position.y - player.size.height / 2;
        let angle: number = Math.atan(newY / newX);
        if (newX < 0) angle += Math.PI;

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