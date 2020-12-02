import { ClassType } from "../classtype";
import { Config } from "../config";
import { AllInfo } from "./allinfo";

export interface JoinRequest {
    name: string;
    color: string;
    classType: ClassType;
    team: number;
}

export interface JoinResponse {
    id: number;
    info: AllInfo;
    config: Config;
}
