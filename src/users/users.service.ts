import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UserDocument } from './schemas/user.schema';
import { CreateUserData } from './types/create-user.type';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UserRepository){}

    async verifyEmail(userId: Types.ObjectId): Promise<UserDocument | null> {
        return this.userRepository.update(
            userId,
            {
                isEmailVerified: true
            }
        )
    }

    async existsByEmail(email: string): Promise<boolean>{
        return this.userRepository.existsByEmail(email);
    }

    async findByEmail(email: string): Promise<UserDocument | null>{
        return this.userRepository.findByEmail(email);
    }

    async findByEmailWithPassword(email: string): Promise<UserDocument | null>{
        return this.userRepository.findByEmailWithPassword(email);
    }

    async create(data: CreateUserData) {
        return this.userRepository.create(data);
    }
}
