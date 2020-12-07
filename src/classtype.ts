export type PlayerClassType = "ninja" | "wizard" | "warrior";
export type AiClassType = "axeai" | "archerai";

export type ClassType = PlayerClassType | AiClassType;

export function isPlayerClassType(classType: ClassType) {
    return (classType === "ninja" || classType === "warrior" || classType === "wizard");
}

export function randomAiClassType(): AiClassType {
    const classType = Math.floor(Math.random() * 2);
    switch(classType) {
        case 0: 
            return "axeai";
        case 1:
            return "archerai"
        default:
            throw new Error("Random is doing bad things")
    }

}