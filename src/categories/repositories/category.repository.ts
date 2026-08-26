import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/repositories/base.repository';
import { Category, CategoryDocument } from '../schemas/category.schema/category.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';


@Injectable()
export class CategoryRepository extends BaseRepository<CategoryDocument> {
    constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {
        super(categoryModel);
    }
}