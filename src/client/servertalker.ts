import { config } from "../config";

export class ServerTalker {
    constructor() {}

    public async getAllInfo() {
        return fetch(config.hostname + "info").then((response) => response.json());
    }
}
