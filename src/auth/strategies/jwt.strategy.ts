import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.types';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    // Inject ConfigService to retrieve the JWT secret.
    private readonly configService: ConfigService,
  ) {
    super({
      // Extract the JWT from the Authorization Bearer header.
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

     // Reject tokens whose expiration time has passed.
     ignoreExpiration: false,

      // Use the same secret that was used to sign the token.
      secretOrKey:
        configService.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),
    });
  }

  async validate(
    payload: JwtPayload,
  ) {
    // Return the authenticated user's identity and role.
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}