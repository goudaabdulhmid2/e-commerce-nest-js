// Import NestJS decorators and Logger for dependency injection and logging.
import {
  Injectable,
  Logger,
} from '@nestjs/common';

// Import the Cron decorator to run the publisher periodically.
import { Cron } from '@nestjs/schedule';

// Import the repository responsible for Outbox database operations.
import { OutboxRepository } from '../repositories/outbox.repository';

// Import the service responsible for adding email jobs to BullMQ.
import { EmailQueueService } from 'src/common/queue/email/email-queue.service';

@Injectable()
export class OutboxPublisherService {

  // Create a logger specifically for this service.
  private readonly logger = new Logger(
    OutboxPublisherService.name,
  );

  

  constructor(

    // Inject the Outbox repository to read and update Outbox events.
    private readonly outboxRepository: OutboxRepository,

    // Inject the email queue service to publish events to BullMQ.
    private readonly emailQueueService: EmailQueueService,
  ) {}

  // Run the publisher every 5 seconds.
  @Cron('*/5 * * * * *')
  async publishPendingEvents(): Promise<void> {

    // Define the maximum number of publishing attempts allowed.
    const  MAX_ATTEMPTS = 5;

    // Atomically claim one eligible Outbox event.
    const event =
      await this.outboxRepository.claimPendingEvent();

    // Stop if there are no events ready to be processed.
    if (!event) return;

    try {

      // Log the event that is currently being published.
      this.logger.log(
        `Publishing outbox event ${event._id}`,
      );

      // Handle EMAIL_VERIFICATION events.
      if (event.type === 'EMAIL_VERIFICATION') {

        // Extract the email and OTP from the event payload.
        const { email, otp } =
          event.payload as {
            email: string;
            otp: string;
          };

        // Add the email job to BullMQ.
        await this.emailQueueService.addVerificationEmail(
          email,
          otp,
          event._id.toString(),
        );

      } else {

        // Reject event types that this publisher does not understand.
        throw new Error(
          `Unsupported outbox event type: ${event.type}`,
        );
      }

      // Mark the Outbox event as PROCESSED after BullMQ accepts the job.
      await this.outboxRepository.markAsProcessed(
        event._id,
      );

      // Log successful publishing of the event.
      this.logger.log(
        `Outbox event ${event._id} processed`,
      );

    } catch (error) {

      const errorMessage = 
        error instanceof Error
            ? error.message
            : String(error);
        

      // Log the error that caused the publishing attempt to fail.
      this.logger.error(
        `Failed to publish outbox event ${event._id}`,
        error,
      );

      // Check whether the event has exhausted all allowed attempts.
      if(event.attempts >= MAX_ATTEMPTS){
        // Mark the event as permanently failed.
        await this.outboxRepository.markdAsFailed(
          event._id,
          errorMessage,
        );

        // Log that no more automatic retries will happen.
        this.logger.error(
          `Outbox event ${event._id} reached maximum attempts and was marked as FAILED`,
        );

        // Stop processing this event.
        return;
      }

      // Calculate how long we should wait before retrying.
      const delay = this.calculateBackoff(
        event.attempts,
      );

      // Calculate the exact time when the next retry is allowed.
      const nextAttemptAt = new Date(
        Date.now() + delay,
      );

      // Log the current attempt and the calculated retry schedule.
      this.logger.warn(
        `Event ${event._id} | Attempt: ${event.attempts} | ` +
        `Retry delay: ${delay}ms | ` +
        `Next attempt: ${nextAttemptAt.toISOString()}`,
      );

      // Return the event to PENDING and schedule its next retry.
      await this.outboxRepository.markAsPending(
        event._id,
        nextAttemptAt,
        errorMessage
      );
    }
  }

  // Calculate an exponential delay based on the number of attempts.
  private calculateBackoff(attempts: number): number {

    // Set the initial retry delay to 5 seconds.
    const BASE_DELAY = 5000;

    // Prevent the retry delay from exceeding 5 minutes.
    const MAX_DELAY = 5 * 60 * 1000;

    // Double the delay after every failed attempt.
    const delay =
      BASE_DELAY * Math.pow(2, attempts - 1);

    // Return the smaller value between the calculated delay and the maximum delay.
    return Math.min(delay, MAX_DELAY);
  }
}