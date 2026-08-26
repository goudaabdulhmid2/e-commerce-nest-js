import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { RoleEnum } from "../enums/role.enum";
import { GenderEnum } from "../enums/gender.enum";

export type UserDocument = HydratedDocument<User>


@Schema({
    timestamps:true
})
export class User {
    @Prop({
        type:String,
        required:true,
        lowercase:true,
        trim:true
    })
    firstName!: string;

    @Prop({
        type:String,
        required:true,
        lowercase:true,
        trim:true
    })
    lastName!: string;

    @Prop({
        type:String,
        required:true,
        unique:true,
        index:{name:'emaii_unique_idx'}
    })
    email!: string;

    @Prop({
        type:String,
        required:true
    })
    password!: string;

    @Prop({
        type:String,
        enum:RoleEnum,
        default:RoleEnum.USER,
    })
    role!: string;

    @Prop({
        type:String,
        enum:GenderEnum,
        required:true,
    })
    gender!: string;

    @Prop({
        type:String,
        required:true
    })
    phone!: string;

    @Prop({
        type:Boolean,
        default:false
    })
    isEmailVerified!: boolean;
    
    @Prop({
        type:Date,
        required:true
    })
    dateOfBirth!: Date;


    @Prop({
        type:Boolean,
        default:false
    })
    isDeleted!: boolean;

}


export const userSchema = SchemaFactory.createForClass(User);
