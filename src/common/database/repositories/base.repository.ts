import { Model, QueryFilter } from "mongoose";

export abstract class BaseRepository<T> {

    constructor(protected readonly model: Model<T>) {}


    async findById(id: string): Promise<T | null> {
        return this.model.findById(id).exec();
    }

    async findOne(filter: QueryFilter<T>): Promise<T | null> {
        return this.model.findOne(filter).exec();
    }

    async findAll(filter: QueryFilter<T> = {}): Promise<T[]> {
        return this.model.find(filter).exec();
    }

    async create(data: Partial<T>): Promise<T> {   
        return this.model.create(data);
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async delete(id: string): Promise<T | null> {
        return this.model.findByIdAndDelete(id).exec();
    }
    


}