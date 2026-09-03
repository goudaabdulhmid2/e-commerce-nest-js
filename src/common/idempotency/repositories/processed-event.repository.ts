import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { BaseRepository } from 'src/common/database/repositories/base.repository';
import {
  ProcessedEvent,
  ProcessedEventDocument,
} from '../schemas/processed-event.schema';
import { ProcessedEventType } from '../enums/processed-event-type.enum';

@Injectable()
export class ProcessedEventRepository
  extends BaseRepository<ProcessedEventDocument>
{
  constructor(
    @InjectModel(ProcessedEvent.name)
    processedEventModel: Model<ProcessedEventDocument>,
  ) {
    super(processedEventModel);
  }

  async existsByEventId(
    eventId: Types.ObjectId,
  ): Promise<boolean> {
    const event = await this.model
      .exists({ eventId })
      .exec();

    return !!event;
  }

  async createProcessedEvent(
    eventId: Types.ObjectId,
    eventType: ProcessedEventType,
  ): Promise<ProcessedEventDocument> {
    return this.create({
      eventId,
      eventType,
      processedAt: new Date(),
    });
  }
}