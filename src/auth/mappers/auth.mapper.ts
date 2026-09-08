import { UserDocument } from "src/users/schemas/user.schema";
import { SignupResponseDto } from "../dto/signup-response.dto";
import { LoginResponseDto } from "../dto/login-response.dto";


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
}