import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Category } from "src/categories/schemas/category.schema/category.schema";
import { User } from "src/users/schemas/user.schema";

export type SubCategoryDocument = HydratedDocument<SubCategory>

@Schema({
    timestamps: true
})
export class SubCategory {


    @Prop({
        type:String,
        required: true,
        lowercase: true,
        trim: true,
        index: {name: 'subCategory_name_index', unique: true}
    })
    name!:string;


    @Prop({
        type:String,
        required: true,
        lowercase: true,
        trim: true,
        index: {name: 'subCategory_slug_index', unique: true}
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

    @Prop({
        type:Types.ObjectId,
        ref: Category.name,
        required:true
    })
    categoryId!: string | Types.ObjectId;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);
 


