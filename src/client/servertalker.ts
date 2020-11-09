import { AllInfo } from "../api/allinfo";
import { config } from "../config";

export class ServerTalker {
    constructor() {}

    public async getAllInfo(): Promise<AllInfo> {
        return fetch(config.hostname + "info").then((response) => response.json());
    }
}
