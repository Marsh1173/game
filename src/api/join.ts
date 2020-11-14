import { Config } from "../config";
import { AllInfo } from "./allinfo";

export interface JoinRequest {
    color: string;
}

export interface JoinResponse {
    id: number;
    info: AllInfo;
    config: Config;
}
