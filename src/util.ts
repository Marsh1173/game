export const slider = safeGetElementById("slider");
export const box = safeGetElementById("slideContainer");

export function safeGetElementById(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (element) {
        return element;
    } else {
        throw new Error(`Element with id ${id} could not be gotten`);
    }
}
