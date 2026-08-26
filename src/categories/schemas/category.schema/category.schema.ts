import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "src/users/schemas/user.schema";

export type CategoryDocument = HydratedDocument<Category>

@Schema({
    timestamps: true
})
export class Category {


    @Prop({
        type:String,
        required: true,
        lowercase: true,
        trim: true,
        index: {name: 'category_name_index', unique: true}
    })
    name!:string;


    @Prop({
        type:String,
        required: true,
        lowercase: true,
        trim: true,
        index: {name: 'category_slug_index', unique: true}
    })
    slug!:string;

    @Prop({
        type:Types.ObjectId,
        ref: User.name,
        required:true
    })
    addedBy!: string | Types.ObjectId;


    @Prop({
        type:Object,
    })
    image!:object;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
 


