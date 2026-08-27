import { GenderEnum } from "../enums/gender.enum";


export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  gender: GenderEnum;
  dateOfBirth: Date;
}