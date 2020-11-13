export const config = {
    playerSize: 50, // Decides player height and width
    blastSize: 180, // Decides blast radius
    blastDuration: 0.15, // Decides blast radius
    blastPower: 300000, // Decides blast radius
    jumpSize: 1000, // Decides player jump height
    playerCount: 2, // from 1-4, decides # of players
    blastCooldown: 20, // Cooldown of player blast ability
    xSize: 3000,
    ySize: 600,
    hostname: "http://192.168.1.6:3000/",
    websocketHostname: "ws://192.168.1.6:3000/",
    playerKeys: {
        up: "Space",
        down: "KeyW",
        left: "KeyA",
        right: "KeyD",
    },
    platformColor: "grey",
    fallingAcceleration: 3000, // momentum per second
    standingSidewaysAcceleration: 13000, // momentum per second
    nonStandingSidewaysAcceleration: 2200, // momentum per second
    maxSidewaysMomentum: 800,
};
