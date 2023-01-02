import { Injectable } from '@nestjs/common';
import { IngestionDatasetQuery } from '../../query/ingestionQuery';
import { DatabaseService } from '../../../database/database.service';
import { genricFunction } from '../gericFunction';
import { IEvent } from '../../interfaces/Ingestion-data'
@Injectable()
export class EventService {
    constructor(private DatabaseService: DatabaseService , private service:genricFunction) { }
    async createEvent(inputData:IEvent) {
        try {
            const eventName = inputData.event_name;
            const queryStr = await IngestionDatasetQuery.getEvents(eventName);
            const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
            if (queryResult?.length === 1) {
                const isValidSchema: any = await this.service.ajvValidator(queryResult[0].event_data.input, inputData);
                if (!isValidSchema.errors) {
                    await this.service.writeToCSVFile(eventName + '_event', [inputData.event]);
                    return {
                        code:200,
                        message: "Event Added Successfully"
                    }
                } else {
                    return{
                        code :404,
                        error:isValidSchema.errors  
                    }
                }
            } else {
                return {
                    code:400,
                    message: "No Event Found"
                }
            }
        } catch (e) {
            console.error('create-event-impl.executeQueryAndReturnResults: ', e.message);
            throw new Error(e);
        }
    }
}
