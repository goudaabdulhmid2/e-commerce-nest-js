import {
  Controller,
  Param,
  Post,
} from '@nestjs/common';

// Import the service responsible for Outbox administrative operations.
import { OutboxAdminService } from '../services/outbox-admin.service';

@Controller('admin/outbox')
export class OutboxAdminController {
  constructor(

    // Inject the admin service that handles the retry operation.
    private readonly outboxAdminService: OutboxAdminService,
  ) {}

  // Handle POST requests for manually retrying a failed Outbox event.
  @Post(':id/retry')
  async retryFailedEvent(
    
    // Extract the event ID from the URL.
    @Param('id') id: string,
  ): Promise<void> {

    // Ask the admin service to retry the failed event.
    await this.outboxAdminService.retryFailedEvent(id);
  }
}