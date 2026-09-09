import { Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "crypto";


@Injectable()
export class RefreshTokenService {
    // Generate a cryptographically secure random refresh token.
    generateToken():string {
        return randomBytes(32).toString('base64url')
    }

    // Generate a unique identifier for a refresh token.
    generateTokenId():string {
        return randomBytes(16).toString('hex')
    }

    // Hash the raw refresh token before storing it in the database.
    hashToken(token: string): string {
        return createHash('sha256')
        .update(token)
        .digest('hex');
    }

}