import { UserDocument } from "src/users/schemas/user.schema";
import { SignupResponseDto } from "../dto/signup-response.dto";
import { LoginResponseDto } from "../dto/login-response.dto";
import { SessionDocument } from "../schemas/session.schema";
import { SessionResponseDto } from "../dto/session-response.dto";


export class AuthMapper {
    static toSignupResponse(
        user:UserDocument,
    ): SignupResponseDto{
        return {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        }
    }
    static toLoginResponse(
    accessToken: string,
     ): LoginResponseDto {
        // Return only authentication data to the client.
        return {
        accessToken,
        };
  }

  static toSessionResponse(
    session: SessionDocument,
  ): SessionResponseDto {
    // Map the internal session document to the public API response.
    return {
      id: session._id.toString(),
      createdAt: session._id.getTimestamp(),
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
    };
  }

  static toSessionResponseList(
    sessions: SessionDocument[],
  ): SessionResponseDto[] {
    // Map every session document to a public response DTO.
    return sessions.map((session) =>
      this.toSessionResponse
        (session),
    );
  }


}