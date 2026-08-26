import { Injectable } from "@nestjs/common";
import { BaseRepository } from "src/common/database/repositories/base.repository";
import { User, UserDocument } from "../schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";



@Injectable()
export class UserRepository extends BaseRepository <UserDocument>{
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>){
        super(userModel);
    }

    async findBtEmail(email: string) : Promise<UserDocument | null> {
        return this.model.findOne({ email }).exec();
    }
}