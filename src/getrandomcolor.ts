const colors: string[] = [
    "aqua",
    "aquamarine",
    "blue",
    "blueviolet",
    "brown",
    "cadetblue",
    "cornflowerblue",
    "crimson",
    "cyan",
    "darkblue",
    "darkcyan",
    "darkgreen",
    "darkmagenta",
    "darkolivegreen",
    "darkorange",
    "darkred",
    "darkslategray",
    "darkviolet",
    "deepskyblue",
    "dodgerblue",
    "firebrick",
    "forestgreen",
    "goldenrod",
    "green",
    "orange",
    "rebeccapurple",
    "seagreen",
    "teal",
    "steelblue",
];

export function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}
