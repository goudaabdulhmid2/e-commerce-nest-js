import { Injectable } from "@nestjs/common";
import { BaseRepository } from "src/common/database/repositories/base.repository";
import { RevokedToken, RevokedTokenDocument } from "../schemas/revoked-token.schema/revoked-token.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";



@Injectable()
export class RevokedTokenRepository extends BaseRepository<RevokedTokenDocument> {
    constructor(@InjectModel(RevokedToken.name) private readonly revokedTokenModel: Model<RevokedTokenDocument>) {
        super(revokedTokenModel);
    }
}