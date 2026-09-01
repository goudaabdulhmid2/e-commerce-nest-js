import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Outbox,
  OutboxSchema,
} from './schemas/outbox.schema';
import { OutboxRepository } from './repositories/outbox.repository';
import { QueueModule } from '../queue/queue.module';
import { OutboxPublisherService } from './services/outbox-publisher.service';

@Module({
  imports: [
    QueueModule,
    MongooseModule.forFeature([
      {
        name: Outbox.name,
        schema: OutboxSchema,
      },
    ]),
  ],

  providers: [
    OutboxRepository,
    OutboxPublisherService
  ],

  exports: [
    OutboxRepository,
    OutboxPublisherService
  ],
})
export class OutboxModule {}