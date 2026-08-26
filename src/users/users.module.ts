import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './schemas/user.schema';
import { UserRepository } from './repositories/user.repository';

@Module({
    imports:[
        MongooseModule.forFeature(
            [
                {name:User.name, schema:userSchema}
            ]
        )
    ] ,
    providers:[
        UserRepository,
    ]
})
export class UsersModule {}
