import { GenderEnum } from "src/users/enums/gender.enum";
import { RoleEnum } from "src/users/enums/role.enum";


export class SignupResponseDto {
    id!: string;
    firstName!: string;
    lastName!: string;
    email!: string;
    phone!: string;
    gender!: GenderEnum;
    dateOfBirth!: Date;
    role!: RoleEnum;
    isEmailVerified!: boolean;

}