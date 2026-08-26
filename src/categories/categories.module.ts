import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema/category.schema';
import { CategoryRepository } from './repositories/category.repository';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])
    ],
    providers: [
        CategoryRepository
    ],
})
export class CategoriesModule {}
