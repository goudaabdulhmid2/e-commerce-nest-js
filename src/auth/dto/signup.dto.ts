import { Type } from "class-transformer";
import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsString, IsStrongPassword, MinLength, Validate } from "class-validator";
import { Match } from "src/common/validators/match.decorator";
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


  // Validate that confirmPassword has the same value
  // as the password property.
    @IsString()
    @IsNotEmpty()
    @Match('password', {
     message: 'Passwords do not match',
    })
    confirmPassword!: string;

    @IsString()
    @IsNotEmpty()
    phone!: string;

    @IsEnum(GenderEnum)
    gender!: GenderEnum;

    // Convert the incoming date string into a Date object
    // before running the @IsDate() validation.
    @Type(() => Date)
    @IsDate()
    dateOfBirth!: Date;
}