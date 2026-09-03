import {
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { Job } from 'bullmq';
import { Types } from 'mongoose';

import { EmailService } from 'src/common/email/email.service';
import { ProcessedEventType } from
  'src/common/idempotency/enums/processed-event-type.enum';
import { ProcessedEventRepository } from
  'src/common/idempotency/repositories/processed-event.repository';

@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger =
    new Logger(EmailProcessor.name);
    
  constructor(
    private readonly emailService: EmailService,
    private readonly processedEventRepository:
      ProcessedEventRepository,
  ) {
    super();
  }

  async process(
    job: Job,
  ): Promise<void> {
    this.logger.log(
      `Job received: ${job.id} | ${job.name}`,
    );

    // Reject unsupported job types.
    if (job.name !== 'verification-email') {
      throw new Error(
        `Unsupported email job: ${job.name}`,
      );
    }

    const {
      email,
      otp,
      outboxEventId,
    } = job.data as {
      email: string;
      otp: string;
      outboxEventId: string;
    };

    const eventId =
      new Types.ObjectId(outboxEventId);

    // Check whether this event was already processed.
    const alreadyProcessed =
      await this.processedEventRepository
        .existsByEventId(eventId);

    if (alreadyProcessed) {
      this.logger.log(
        `Event ${outboxEventId} already processed. Skipping.`,
      );

      return;
    }

    // Execute the actual side effect.
    this.logger.log(
      `Sending verification email to ${email}`,
    );

    await this.emailService.sendOtp(
      email,
      otp,
    );


    try {
      // Record successful processing.
      await this.processedEventRepository
        .createProcessedEvent(
          eventId,
          ProcessedEventType.EMAIL_VERIFICATION,
        );
    } catch (error) {
      // A duplicate means another worker already recorded the event.
      if (this.isDuplicateKeyError(error)) {
        this.logger.warn(
          `Event ${outboxEventId} was already recorded.`,
        );

        return;
      }

      throw error;
    }

    this.logger.log(
      `Event ${outboxEventId} processed successfully.`,
    );
  }

  private isDuplicateKeyError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}