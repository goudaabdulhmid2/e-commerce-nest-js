import { Injectable } from '@nestjs/common';

// Import Types to work with MongoDB ObjectIds.
import { Types } from 'mongoose';

// Import the repository responsible for Outbox database operations.
import { OutboxRepository } from '../repositories/outbox.repository';

@Injectable()
export class OutboxAdminService {
  constructor(

    // Inject the Outbox repository to perform database operations.
    private readonly outboxRepository: OutboxRepository,
  ) {}

  // Retry a failed Outbox event manually.
  async retryFailedEvent(
    id: string,
  ): Promise<void> {

    // Convert the string ID received from the HTTP request
    // into a MongoDB ObjectId.
    const eventId = new Types.ObjectId(id);

    // Move the FAILED event back to PENDING
    // so the normal Outbox Publisher can process it again.
    await this.outboxRepository.retryFailedEvent(
      eventId,
    );
  }
}