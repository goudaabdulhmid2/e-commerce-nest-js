import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { OutboxRepository } from '../repositories/outbox.repository';
import { EmailQueueService } from 'src/common/queue/email/email-queue.service';

@Injectable()
export class OutboxPublisherService {
  private readonly logger =
    new Logger(OutboxPublisherService.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  // Every 5 seconds => claim one Outbox event => publish it to BullMQ.
  @Cron('*/5 * * * * *')
  async publishPendingEvents(): Promise<void> {
    // Atomically claim a PENDING event or recover an expired PROCESSING event.
    const event =
      await this.outboxRepository.claimPendingEvent();

    if (!event) {
      return;
    }

    try {
      this.logger.log(
        `Publishing outbox event ${event._id}`,
      );

      // Publish email verification events to BullMQ.
      if (event.type === 'EMAIL_VERIFICATION') {
        const { email, otp } = event.payload as {
          email: string;
          otp: string;
        };

        await this.emailQueueService.addVerificationEmail(
          email,
          otp,
          event._id.toString(),
        );

        // Mark the event as processed after publishing it to BullMQ.
        await this.outboxRepository.markAsProcessed(
          event._id,
        );
  
        this.logger.log(
          `Outbox event ${event._id} processed`,
        );

      } else {
        throw new Error(
            `Unsupported outbox event type: ${event.type}`,
        );
        }

    } catch (error) {
      this.logger.error(
        `Failed to publish outbox event ${event._id}`,
        error,
      );

      const delay = this.calculateBackoff(event.attempts);

      const nextAttemptAt = new Date(
        Date.now() + delay
      )

      // Make the event available for retry.
      await this.outboxRepository.markAsPending(
        event._id,
        nextAttemptAt,
        error instanceof Error 
          ? error.message
          : String(error)
      );

      return;
    }
  }

  private calculateBackoff(attempts: number): number {
    const BASE_DELAY = 5000
    const MAX_DELAY = 5 * 60 * 1000;

    const delay = 
      BASE_DELAY * Math.pow(2, attempts - 1);

      return Math.min(delay, MAX_DELAY)
  }
}