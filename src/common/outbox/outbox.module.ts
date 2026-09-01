import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Outbox,
  OutboxSchema,
} from './schemas/outbox.schema';
import { OutboxRepository } from './repositories/outbox.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Outbox.name,
        schema: OutboxSchema,
      },
    ]),
  ],

  providers: [
    OutboxRepository,
  ],

  exports: [
    OutboxRepository,
  ],
})
export class OutboxModule {}