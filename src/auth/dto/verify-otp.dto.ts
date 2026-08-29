import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from "class-validator";
import { OtpTypes } from "../enums/otpType.enum";



export class VerifyOtpDto{

    @IsEmail()
    @IsNotEmpty()
    email!: string

    @IsString()
    @IsNotEmpty()
    @Length(6,6)
    otp!: string

    @IsEnum(OtpTypes)
    otpType!: OtpTypes;
}