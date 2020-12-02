import { Config } from "../config";
import { AllInfo } from "./allinfo";

export interface JoinRequest {
    name: string;
    color: string;
    classType: number;
    team: number;
}

export interface JoinResponse {
    id: number;
    info: AllInfo;
    config: Config;
}
