import { ActionMessage, ClientMessage, ServerMessage } from "../api/message";
import { config } from "../config";

export class ServerTalker {
    constructor(public messageHandler: (data: ServerMessage) => void = () => {}, private readonly websocket = new WebSocket(config.websocketHostname)) {
        websocket.onmessage = (ev) => {
            const data = JSON.parse(ev.data);
            this.messageHandler(data);
        };
    }

    public sendMessage(data: ClientMessage) {
        this.websocket.send(JSON.stringify(data));
    }

    public playerJump(id: number) {
        const data: ActionMessage = {
            type: "action",
            actionType: "jump",
            id,
        };
        this.websocket.send(JSON.stringify(data));
    }

    private async postHelper(url: string, data: any): Promise<any> {
        return fetch(config.hostname + url, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        }).then((response) => response.json());
    }

    private async getHelper(url: string): Promise<any> {
        return fetch(config.hostname + url).then((response) => response.json());
    }

    public leave() {
        this.websocket.close();
    }
}
