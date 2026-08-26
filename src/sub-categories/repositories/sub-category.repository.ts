import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BaseRepository } from "src/common/database/repositories/base.repository";
import { SubCategory, SubCategoryDocument } from "../schemas/sub-category.schema/sub-category.schema";
import { Model } from "mongoose";


@Injectable()
export class SubCategoryRepository  extends BaseRepository<SubCategoryDocument> {
    constructor(@InjectModel(SubCategory.name) private readonly subCategoryModel: Model<SubCategoryDocument>) {
        super(subCategoryModel);
    }
}