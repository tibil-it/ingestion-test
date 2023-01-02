import { HttpStatus, Injectable, Res } from '@nestjs/common';
import { IngestionDatasetQuery } from '../../query/ingestionQuery';
import { DatabaseService } from '../../../database/database.service';
import { genricFunction } from '../gericFunction';
import { Dataset } from '../../interfaces/Ingestion-data'
@Injectable()
export class DatasetService {
    constructor(private DatabaseService: DatabaseService , private service:genricFunction) { }
    async createDataset(inputData:Dataset) {
        try {
            const datasetName = inputData.dataset_name;
            const queryStr = await IngestionDatasetQuery.getDataset(datasetName);
            const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
            if (queryResult?.length === 1) {
                const isValidSchema:any = await this.service.ajvValidator(queryResult[0].dataset_data.input, inputData);
                if (!isValidSchema.errors) {
                    await this.service.writeToCSVFile(datasetName, [inputData.dataset["items"]]);
                    return {
                        code:200,
                        message: "Dataset Added Successfully"
                    }
                }
                else {
                    return {
                        code:404,
                        error:isValidSchema.errors
                    }
                }
            }
            else {
                return {
                    code:400,
                    message: "No Dataset Found"
                }
            }
        }
        catch (e) {
            console.error('create-dataset executeQueryAndReturnResults: ', e.message);
            throw new Error(e);
        }
    }
}
