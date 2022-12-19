import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { DatabaseService } from 'src/database/database.service';
import { IngestionController } from './controller/ingestion.controller';
import { IngestionService } from './services/ingestion.service';

@Module({
    controllers: [IngestionController],
    providers: [IngestionService],
    imports:[DatabaseModule, HttpModule]
})
export class IngestionModule {
    
}
