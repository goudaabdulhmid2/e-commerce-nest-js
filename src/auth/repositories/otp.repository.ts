import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BaseRepository } from "src/common/database/repositories/base.repository";
import { Otp, OtpDocument } from "../schemas/otp.schema/otp.schema";
import { Model } from "mongoose";



@Injectable()
export class OtpRepository extends BaseRepository<OtpDocument> {
    constructor(@InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>) {
        super(otpModel);
    }
}