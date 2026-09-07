// Define the lifecycle states of an Outbox event.
export enum OutboxStatus {
  // The event is waiting to be published.
  PENDING = 'PENDING',

  // A publisher currently owns the event.
  PROCESSING = 'PROCESSING',

  // The event was successfully published to BullMQ.
  PROCESSED = 'PROCESSED',

  // The event exceeded the maximum retry attempts.
  FAILED = 'FAILED',
}