import { Injectable } from '@nestjs/common';
import { IngestionDatasetQuery } from '../../query/ingestionQuery';
import { DatabaseService } from '../../../database/database.service';
import { genricFunction } from '../gericFunction';
import { Dimension } from '../../interfaces/Ingestion-data'
@Injectable()
export class DimensionService {
    constructor(private DatabaseService: DatabaseService , private service:genricFunction) { }
    async createDimenshion(inputData:Dimension) {
        try {
            const dimensionName = inputData.dimension_name;
            const queryStr = await IngestionDatasetQuery.getDimesnsion(dimensionName);
            const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
            if (queryResult?.length === 1) {
                const isValidSchema :any = await this.service.ajvValidator(queryResult[0].dimension_data.input, inputData);
                if (!isValidSchema.errors) {
                    await this.service.writeToCSVFile(dimensionName + '_dimension', [inputData.dimension]);
                    return {
                        code:200,
                        message: "Dimension Added Successfully"
                    }
                } else {
                    return {
                        code:404,
                        error:isValidSchema.errors
                    }
                }
            } else {
                return {
                    code:400,
                    message: "No Dimension Found"
                }
            }
        } catch (e) {
            console.error('create-dimension-impl.executeQueryAndReturnResults:', e.message);
            throw new Error(e);
        }
    }
}
