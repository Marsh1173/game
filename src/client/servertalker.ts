import { JoinRequest, JoinResponse } from "../api/join";
import { ClientMessage, ServerMessage } from "../api/message";

export class ServerTalker {
    public static readonly hostName = window.location.host;
    public readonly serverTalkerReady: Promise<JoinResponse>;
    private websocket?: WebSocket;
    constructor(joinRequest: JoinRequest, public messageHandler: (data: ServerMessage) => void = () => {}) {
        this.serverTalkerReady = new Promise<JoinResponse>((resolve, reject) => {
            this.join(joinRequest).then((response) => {
                this.websocket = new WebSocket("ws://" + ServerTalker.hostName + "/" + response.id.toString());
                this.websocket.onmessage = (ev) => {
                    const data = JSON.parse(ev.data);
                    this.messageHandler(data);
                };
                this.websocket.onopen = () => {
                    resolve(response);
                };
            });
        });
    }

    public async sendMessage(data: ClientMessage) {
        if (!this.websocket) {
            await this.serverTalkerReady;
        }
        this.websocket!.send(JSON.stringify(data));
    }

    public async join(request: JoinRequest): Promise<JoinResponse> {
        return this.postHelper("join", request);
    }

    private async postHelper(url: string, data: any): Promise<any> {
        return fetch("http://" + ServerTalker.hostName + "/" + url, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        }).then((response) => response.json());
    }

    private async getHelper(url: string): Promise<any> {
        return fetch("http://" + ServerTalker.hostName + "/" + url).then((response) => response.json());
    }

    public async leave() {
        if (!this.websocket) {
            await this.serverTalkerReady;
        }
        this.websocket!.close();
    }
}
