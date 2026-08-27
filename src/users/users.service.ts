import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UserDocument } from './schemas/user.schema';
import { CreateUserData } from './types/create-user.type';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UserRepository){}

    async existsByEmail(email: string): Promise<boolean>{
        return this.userRepository.existsByEmail(email);
    }

    async findByEmail(email: string): Promise<UserDocument | null>{
        return this.userRepository.findByEmail(email);
    }

    async create(data: CreateUserData) {
        return this.userRepository.create(data);
    }
}
