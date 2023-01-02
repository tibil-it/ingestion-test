import {Dataset, Dimension, IEvent, Pipeline} from './../interfaces/Ingestion-data';
import {Body, Controller, HttpCode, Post, Res} from '@nestjs/common';
import {DatasetService} from '../services/dataset/dataset.service';
import {DimensionService} from '../services/dimension/dimension.service';
import {EventService} from '../services/event/event.service';
import {PipelineService} from '../services/pipeline/pipeline.service';
import {Response} from 'express';

@Controller('ingestion')
export class IngestionController {
    constructor(
        private datasetservice: DatasetService, private dimesionService: DimensionService
        , private eventService: EventService, private pipelineService: PipelineService) {
    }

    @Post('/dataset')
    async createDataset(@Body() inputData: Dataset, @Res()response: Response) {
        try {
            let result = await this.datasetservice.createDataset(inputData);
            if (result.code == 400) {
                response.status(400).send({"message": result.message});
            } else {
                response.status(200).send({"message": result.message});
            }
        }
        catch (e) {
            console.error('create-dataset-impl: ', e.message);
            throw new Error(e);
        }
    }

    @Post('/dimension')
    async createDimenshion(@Body() inputData: Dimension, @Res()response: Response) {
        try {
            let result = await this.dimesionService.createDimenshion(inputData);
            if (result.code == 400) {
                response.status(400).send({"message": result.message});
            } else {
                response.status(200).send({"message": result.message});
            }
        } catch (e) {
            console.error('create-dimension-impl: ', e.message);
            throw new Error(e);
        }
    }

    @Post('/event')
    async createEvent(@Body() inputData: IEvent, @Res()response: Response) {
        try {
            let result = await this.eventService.createEvent(inputData)
            if (result.code == 400) {
                response.status(400).send({"message": result.message});
            } else {
                response.status(200).send({"message": result.message});
            }
        } catch (e) {
            console.error('create-event-impl: ', e.message);
            throw new Error(e);
        }
    }

    @Post('/pipeline')
    async pipeline(@Body() pipelineData: Pipeline, @Res()response: Response) {
        try {
            let result = await this.pipelineService.pipeline(pipelineData);
            console.log('ingestion.controller.pipeline: ', result);
            if (result.code == 400) {
                response.status(400).send({"message": result.message});
            } else {
                response.status(200).send({"message": result.message});
            }
        }
        catch (e) {
            console.error('create-pipeline-impl: ', e.message);
            throw new Error(e);
        }
    }
}
