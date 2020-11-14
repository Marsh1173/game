import { Config } from "../config";
import { AllInfo } from "./allinfo";

export interface JoinRequest {
    name: string;
    color: string;
}

export interface JoinResponse {
    id: number;
    info: AllInfo;
    config: Config;
}
