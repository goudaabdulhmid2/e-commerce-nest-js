import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsString, IsStrongPassword, MinLength } from "class-validator";
import { GenderEnum } from "src/users/enums/gender.enum"


export class SignupDto{

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    lastName!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password!: string;

    @IsString()
    @IsNotEmpty()
    phone!: string;

    @IsEnum(GenderEnum)
    gender!: GenderEnum;

    @IsDate()
    dataOfBirth!: Date;
}