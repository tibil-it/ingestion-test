import { Injectable } from '@nestjs/common';
import Ajv from "ajv";
const ajv = new Ajv();
const ObjectsToCsv = require('objects-to-csv');
@Injectable()
export class genricFunction {
    async writeToCSVFile(fileName, inputArray) {
        try {
            const csv = new ObjectsToCsv(inputArray);
            let response = await csv.toDisk(`./${fileName}.csv`, { append: true });
            return response;
        } catch (e) {
            console.error('writeToCSVFile: ', e.message);
            throw new Error(e);
        }
    }
    async ajvValidator(schema, inputData) {
        const isValid = ajv.validate(schema, inputData);
        if (isValid) {
            return inputData;
        } else {
            return {
                errors: ajv.errors
            };
        }
    }
}