import { ClientSession, Model, QueryFilter, Types } from "mongoose";

export abstract class BaseRepository<T> {

    constructor(protected readonly model: Model<T>) {}


    async findById(id: Types.ObjectId): Promise<T | null> {
        return this.model.findById(id).exec();
    }

    async findOne(filter: QueryFilter<T>): Promise<T | null> {
        return this.model.findOne(filter).exec();
    }

    async findAll(filter: QueryFilter<T> = {}): Promise<T[]> {
        return this.model.find(filter).exec();
    }

    async create(data: Partial<T>, session?: ClientSession): Promise<T> {   
        const [document] =
            await this.model.create(
                [data as any],
                {session}
            )
        return document;
    }

    async update(id: Types.ObjectId, data: Partial<T>): Promise<T | null> {
        return this.model.findByIdAndUpdate(id, data, {  returnDocument: 'after' }).exec();
    }

    async delete(id: Types.ObjectId): Promise<T | null> {
        return this.model.findByIdAndDelete(id).exec();
    }
    


}