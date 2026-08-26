import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategory, SubCategorySchema } from './schemas/sub-category.schema/sub-category.schema';
import { SubCategoryRepository } from './repositories/sub-category.repository';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: SubCategory.name, schema: SubCategorySchema }])
    ],
    providers: [
        SubCategoryRepository
    ]
})
export class SubCategoriesModule {}
