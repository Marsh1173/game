import { PlayerActions } from "../objects/player";
import { SerializedPlayer } from "../serialized/player";
import { AllInfo } from "./allinfo";

export interface JoinMessage {
    type: "join";
    id: number;
    info: AllInfo;
}

export interface PlayerInfoMessage {
    type: "playerInfo";
    id: number;
    info: SerializedPlayer;
}

export interface PlayerLeavingMessage {
    type: "playerLeaving";
    id: number;
}

export interface InfoMessage {
    type: "info";
    info: AllInfo;
}

export type ServerMessage = JoinMessage | PlayerInfoMessage | PlayerLeavingMessage | InfoMessage;

export interface ActionMessage {
    type: "action";
    actionType: PlayerActions;
    id: number;
}

export type ClientMessage = ActionMessage;