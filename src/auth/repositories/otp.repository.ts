import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BaseRepository } from "src/common/database/repositories/base.repository";
import { Otp, OtpDocument } from "../schemas/otp.schema/otp.schema";
import { Model, Types } from "mongoose";
import { OtpTypes } from "../enums/otpType.enum";
import { PasswordService } from "src/common/security/password/password.service";



@Injectable()
export class OtpRepository extends BaseRepository<OtpDocument> {
    constructor(@InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>, private readonly passwordService: PasswordService) {
        super(otpModel);
    }

}