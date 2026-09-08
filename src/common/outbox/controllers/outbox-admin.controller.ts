import {
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

// Import the service responsible for Outbox administrative operations.
import { OutboxAdminService } from '../services/outbox-admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { Types } from 'mongoose';

@Controller('admin/outbox')
export class OutboxAdminController {
  constructor(

    // Inject the admin service that handles the retry operation.
    private readonly outboxAdminService: OutboxAdminService,
  ) {}

  // Handle POST requests for manually retrying a failed Outbox event.
  @Post(':id/retry')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async retryFailedEvent(
    
    // Extract the event ID from the URL.
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<void> {

    // Retry the failed Outbox event through the admin service.
    await this.outboxAdminService.retryFailedEvent(id);
  }
}