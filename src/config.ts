export const config = {
    playerSize: 50, // Decides player height and width
    blastSize: 50, // Decides blast radius
    jumpSize: 800, // Decides player jump height
    playerCount: 2, // from 1-4, decides # of players
    blastCooldown: 20, // Cooldown of player blast ability
    xSize: 800,
    ySize: 500,
    hostname: "http://localhost:3000/",
    websocketHostname: "ws://localhost:3000/",
    playerKeys: {
        up: "KeyW",
        down: "KeyS",
        left: "KeyA",
        right: "KeyD",
    },
    platformColor: "grey",
    fallingAcceleration: 2000, // momentum per second
    standingSidewaysAcceleration: 10000, // momentum per second
    nonStandingSidewaysAcceleration: 2500, // momentum per second
    maxSidewaysMomentum: 600,
};
