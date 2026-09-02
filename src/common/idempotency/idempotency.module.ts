import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProcessedEvent, ProcessedEventSchema } from "./schemas/processed-event.schema";
import { ProcessedEventRepository } from "./repositories/processed-event.repository";


@Module({
    imports: [
        MongooseModule.forFeature([{
            name: ProcessedEvent.name,
            schema: ProcessedEventSchema
        }])
    ],
    providers: [
        ProcessedEventRepository
    ],
    exports: [
        ProcessedEventRepository
    ]
})
export class IdempotencyModule {}