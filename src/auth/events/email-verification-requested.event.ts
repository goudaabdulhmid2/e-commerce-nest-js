import { Types } from "mongoose";


export class EmailVerificationRequestEvent {
    constructor(
        public readonly userId: Types.ObjectId,
        public readonly email: string,
        public readonly otp: string
    ){}
}