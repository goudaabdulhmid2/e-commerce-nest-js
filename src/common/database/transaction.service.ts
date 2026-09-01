import { Injectable } from '@nestjs/common';
import {
  ClientSession,
  Connection,
} from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class TransactionService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async run<T>(
    callback: (
      session: ClientSession,
    ) => Promise<T>,
  ): Promise<T> {
    const session =
      await this.connection.startSession();

    try {
      // Start the MongoDB transaction.
      session.startTransaction();

      // Execute all operations using the same session.
      const result = await callback(session);

      // Commit all operations atomically.
      await session.commitTransaction();

      return result;
    } catch (error) {
      // Roll back all operations performed in this transaction.
      await session.abortTransaction();

      throw error;
    } finally {
      // Release the MongoDB session.
      await session.endSession();
    }
  }
}