import {
  ClientSession,
  Model,
  QueryFilter,
  Types,
} from 'mongoose';

export abstract class BaseRepository<T> {
  constructor(
    protected readonly model: Model<T>,
  ) {}

  async findById(
    id: Types.ObjectId,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findById(id)
      .session(session ?? null)
      .exec();
  }

  async findOne(
    filter: QueryFilter<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findOne(filter)
      .session(session ?? null)
      .exec();
  }

  async findAll(
    filter: QueryFilter<T> = {},
    session?: ClientSession,
  ): Promise<T[]> {
    return this.model
      .find(filter)
      .session(session ?? null)
      .exec();
  }

  async create(
    data: Partial<T>,
    session?: ClientSession,
  ): Promise<T> {
    const [document] =
      await this.model.create(
        [data as any],
        { session },
      );

    return document;
  }

  async update(
    id: Types.ObjectId,
    data: Partial<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        data,
        {
          returnDocument: 'after',
          session,
        },
      )
      .exec();
  }

  async delete(
    id: Types.ObjectId,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findByIdAndDelete(id, { session })
      .exec();
  }
}