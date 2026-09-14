import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import {
  BaseRepository,
} from 'src/common/database/repositories/base.repository';

import {
  Session,
  SessionDocument,
} from '../schemas/session.schema';

@Injectable()
export class SessionRepository
  extends BaseRepository<SessionDocument>
{
  constructor(
    @InjectModel(Session.name)
    sessionModel: Model<SessionDocument>,
  ) {
    super(sessionModel);
  }

  async findActiveSession(
    sessionId: Types.ObjectId,
    session?: ClientSession
  ): Promise<SessionDocument | null> {
    // Find a session that has not been revoked and has not expired.
    return this.model
      .findOne({
        _id: sessionId,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      }
    ).session(session ?? null)
      .exec();
  }

  async revoke(
    sessionId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    // Revoke the authentication session.
    await this.model.updateOne(
      {
        _id: sessionId,
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
      {
        session
      }

    );
  }

  async updateLastUsed(
    sessionId: Types.ObjectId,
    session: ClientSession
  ): Promise<void> {
    // Update the last time this session was used.
    await this.model.updateOne(
      {
        _id: sessionId,
        revokedAt: { $exists: false },
      },
      {
        $set: {
          lastUsedAt: new Date(),
        },
      },
      {
        session
      }
    );
  }
}