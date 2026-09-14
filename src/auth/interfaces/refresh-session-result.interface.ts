import { Types } from "mongoose";

export interface RefreshSessionResult {
    sessionId: Types.ObjectId;

    refreshToken: string;
}