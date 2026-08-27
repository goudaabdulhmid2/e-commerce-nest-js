import { UserDocument } from "src/users/schemas/user.schema";
import { SignupResponseDto } from "../dto/signup-response.dto";


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
}