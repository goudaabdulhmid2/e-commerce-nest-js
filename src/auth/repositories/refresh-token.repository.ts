import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  BaseRepository,
} from 'src/common/database/repositories/base.repository';

import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshTokenDocument> {
  constructor(
    @InjectModel(RefreshToken.name)
    refreshTokenModel: Model<RefreshTokenDocument>,
  ) {
    super(refreshTokenModel);
  }

  async findByTokenId(
    tokenId: string,
  ): Promise<RefreshTokenDocument | null> {
    // Find the refresh token using its unique identifier.
    return this.model
      .findOne({
        tokenId,
      })
      .exec();
  }

  async findByHash(
  tokenHash: string,
    ): Promise<RefreshTokenDocument | null> {
    // Find a refresh token using its stored hash.
    return this.model
        .findOne({
        tokenHash,
        })
        .exec();
    }

  async markAsUsed(
    id: Types.ObjectId,
    replacedByTokenId: string,
  ): Promise<void> {
    // Mark the current refresh token as consumed by rotation.
    await this.model.updateOne(
      {
        _id: id,
        usedAt: { $exists: false },
      },
      {
        $set: {
          usedAt: new Date(),
          replacedByTokenId,
        },
      },
    );
  }

  async revokeBySessionId(
    sessionId: Types.ObjectId,
  ): Promise<void> {
    // Revoke all refresh tokens belonging to the session.
    await this.model.updateMany(
      {
        sessionId,
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );
  }

  async consumeToken(
    tokenId: string,
    replacedByTokenId: string,

  ): Promise<RefreshTokenDocument | null>{
    // Atomically find an active refresh token and mark it as used.
    return this.model.findOneAndUpdate({
        tokenId,
        usedAt: {$exists: false},
        revokedAt: {$exists: false},
        expiresAt: {$gt: new Date()}
    },{
        $set:{
            usedAt: new Date(),
            replacedByTokenId
        }
    },{
        returnDocument: 'before'
    }).exec()

  }
}