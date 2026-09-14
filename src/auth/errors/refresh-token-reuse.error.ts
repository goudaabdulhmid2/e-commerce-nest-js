import { Types } from "mongoose";

export class RefreshTokenReuseError extends Error{
    constructor(
        public readonly sessionId: Types.ObjectId
    ){
        super('Refresh token reuse detected')

        // Set a specific error name for logging and debugging.
        this.name = 'RefreshTokenReuseError'
    }
}