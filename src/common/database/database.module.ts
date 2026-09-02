import { Global, Module } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";


@Global()
@Module({
    imports:[
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (
                configService:ConfigService
            )=> ({
                uri:configService.getOrThrow<string>('DB_URL')
            })
        })
    ],
    providers:[TransactionService],
    exports:[
        TransactionService,
        MongooseModule
    ]

})
export class DatabaseModule{
    
}