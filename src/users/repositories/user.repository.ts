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

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.model.findOne({ email }).select('+password').exec();
    }

    // Check whether a user with the given email already exists.
    // This is an application-level check used to provide
    // an early and user-friendly response.
    async existsByEmail(email: string): Promise<boolean>{
        const user = await this.model.exists({email}).exec();

        return !!user;
    }
}