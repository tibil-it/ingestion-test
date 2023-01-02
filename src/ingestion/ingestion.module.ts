import { HttpCustomService } from './services/HttpCustomService';
import {HttpModule} from '@nestjs/axios';
import {Module} from '@nestjs/common';
import {DatabaseModule} from 'src/database/database.module';
import {IngestionController} from './controller/ingestion.controller';
import { DatasetService } from './services/dataset/dataset.service';
import { DimensionService } from './services/dimension/dimension.service';
import { PipelineService } from './services/pipeline/pipeline.service';
import { EventService } from './services/event/event.service';
import { genricFunction } from './services/gericFunction';
@Module({
    controllers: [IngestionController],
    providers: [DatasetService,DimensionService,PipelineService,EventService ,genricFunction, HttpCustomService],
    imports: [DatabaseModule, HttpModule]
})
export class IngestionModule {
}
