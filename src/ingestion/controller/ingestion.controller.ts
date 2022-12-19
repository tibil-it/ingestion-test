import { Dataset, Dimension, IEvent, Pipeline } from './../interfaces/Ingestion-data';
import { Body, Controller, Post } from '@nestjs/common';
import { IngestionService } from '../services/ingestion.service';
import { IngestionDatasetQuery } from '../query/ingestionQuery';
import { DatabaseService } from 'src/database/database.service';
import { HttpService } from '@nestjs/axios';

@Controller('ingestion')
export class IngestionController {

    constructor(private service: IngestionService, private DatabaseService: DatabaseService, private http: HttpService) { }
    @Post('dataset')
    async createDataset(@Body() inputData:Dataset) {
        try {
            const datasetName = inputData.dataset_name;
            console.log(datasetName);
            const queryStr = await IngestionDatasetQuery.getDataset(datasetName);
            const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
            if (queryResult.length === 1) {
                const isValidSchema = await this.service.ajvValidator(queryResult[0].dataset_data.input, inputData);
                console.log(queryResult[0].dataset_data.input.properties.dataset.properties);
                console.log("Input data",inputData);
                if (!isValidSchema['message']) {
                    await this.service.writeToCSVFile(datasetName, [inputData.dataset]);
                    return {
                        message: "Dataset Added Successfully"
                    }
                }
                else {
                    console.log(isValidSchema);
                    return isValidSchema['message']

                }
            }
            else {
                return {
                    message: "No Dataset Found"
                }
            }
        }

        catch (e) {
            console.error('create-dataset.: ', e.message);
            throw new Error(e);
        }

    }

    @Post('dimension')
    async createDimenshion(@Body() inputData:Dimension) {
        try {

            const dimensionName = inputData.dimension_name;
            const queryStr = await IngestionDatasetQuery.getDimesnsion(dimensionName);
            const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
            if (queryResult.length === 1) {
                const isValidSchema = await this.service.ajvValidator(queryResult[0].dimension_data.input, inputData);
                console.log(queryResult[0].dimension_data.input);
                console.log("Input data",inputData);
                if (!isValidSchema['message']) {
                    await this.service.writeToCSVFile(dimensionName, [inputData.dimension]);
                    return {
                        message: "Dimension Added Successfully"
                    }
                } else {
                    return isValidSchema
                }
            } else {
                return {
                    message: "No Dimension Found"
                }
            }
        } catch (e) {
            console.error('create-dimension-impl.executeQueryAndReturnResults: ', e.message);
            throw new Error(e);
        }
    }

    @Post('event')
    async createEvent(@Body() inputData:IEvent) {

        try {
            
            const eventName = inputData.event_name;
            const queryStr = await IngestionDatasetQuery.getEvents(eventName);
            const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
            if (queryResult.length === 1) {
                const isValidSchema = await this.service.ajvValidator(queryResult[0].event_data.input, inputData);
                console.log(queryResult[0].event_data.input);
                if (!isValidSchema['errors']) {
                    await this.service.writeToCSVFile(eventName, [inputData.event]);
                    return {
                        message: "Event Added Successfully"
                    }
                } else {
                    return isValidSchema
                }
            } else {
                return {
                    message: "No Event Found"
                }
            }
        } catch (e) {
            console.error('create-event-impl.executeQueryAndReturnResults: ', e.message);
            throw new Error(e);
        }
    }

    @Post('pipeline')
    async pipeline(@Body() pipelineData: Pipeline) {
        let nifi_root_pg_id, pg_list, pg_source;

        const processor_group_name = pipelineData.pipeline_name;

        await this.addProcessorGroup(processor_group_name)

        this.http.get(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/process-groups/root`).subscribe((res: any) => {
            nifi_root_pg_id = res.data.component.id;
            this.http.get(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/flow/process-groups/${nifi_root_pg_id}`).subscribe(async (res: any) => {
                pg_list = res.data

                pg_list['processGroupFlow']['flow']['processGroups'].forEach((pg: any) => {
                    if (pg['component']['name'] == processor_group_name) {
                        pg_source = pg
                    }
                });

                await this.addProcessor('org.apache.nifi.processors.standard.GenerateFlowFile', 'generateFlowFile', pg_source['component']['id'])
                await this.addProcessor('org.apache.nifi.processors.standard.ExecuteStreamCommand', 'pythonCode', pg_source['component']['id'])
                await this.addProcessor('org.apache.nifi.processors.standard.LogMessage', 'successLogMessage', pg_source['component']['id'])
                await this.addProcessor('org.apache.nifi.processors.standard.LogMessage', 'failedLogMessage', pg_source['component']['id'])

                const generateFlowFileID = await this.getProcessorSourceId(pg_source['component']['id'], 'generateFlowFile')
                const pythonCodeID = await this.getProcessorSourceId(pg_source['component']['id'], 'pythonCode')
                const successLogMessageID = await this.getProcessorSourceId(pg_source['component']['id'], 'successLogMessage')
                const failedLogMessageID = await this.getProcessorSourceId(pg_source['component']['id'], 'failedLogMessage')

                const success_relationship = ["success"]
                const python_failure_relationship = ["nonzero status"]
                const python_success_relationship = ["output stream"]
                const autoterminate_relationship = ["success"]

                await this.connect(generateFlowFileID, pythonCodeID, success_relationship, pg_source['component']['id'])
                await this.connect(pythonCodeID, successLogMessageID, python_success_relationship, pg_source['component']['id'])
                await this.connect(pythonCodeID, failedLogMessageID, python_failure_relationship, pg_source['component']['id'])
                await this.connect(successLogMessageID, successLogMessageID, autoterminate_relationship, pg_source['component']['id'])
                await this.connect(failedLogMessageID, failedLogMessageID, autoterminate_relationship, pg_source['component']['id'])

                await this.updateProcessorProperty(pg_source['component']['id'], 'pythonCode');
                await this.updateProcessorProperty(pg_source['component']['id'], 'generateFlowFile');


                const data = {
                    "id": pg_source['component']['id'],
                    "state": "RUNNING",  // RUNNING or STOP
                    "disconnectedNodeAcknowledged": false
                }
                this.http.put(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/flow/process-groups/${pg_source['component']['id']}`, data).subscribe((res: any) => {
                    console.log(res.data)
                })
            })
        })
    }

    addProcessorGroup(processor_group_name: string) {
        return new Promise<any>((resolve, reject) => {
            this.http.get(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/process-groups/root`).subscribe((res: any) => {
                const nifi_root_pg_id = res.data.component.id;
                const minRange = -500;
                const maxRange = 500;
                const x = Math.floor(Math.random() * (maxRange - minRange) + minRange)
                const y = Math.floor(Math.random() * (maxRange - minRange) + minRange)
                const pg_details = {
                    "revision": {
                        "clientId": "",
                        "version": 0
                    },
                    "disconnectedNodeAcknowledged": "false",
                    "component": {
                        "name": processor_group_name,
                        "position": {
                            "x": x,
                            "y": y
                        }
                    }
                }

                this.http.post<any>(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/process-groups/${nifi_root_pg_id}/process-groups`, pg_details).subscribe((res: any) => {
                    if (res) {
                        console.log("Successfully created the processor group", processor_group_name)
                        resolve('Successfully created the processor group')
                    }
                    else {
                        console.log("Failed to create the processor group", processor_group_name)
                        reject('Failed to create the processor group')
                    }
                })
            });
        })
    }

    addProcessor(processor_name, name, pg_source_id) {
        return new Promise<any>((resolve, reject) => {
            this.http.get<any>(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/flow/process-groups/${pg_source_id}`).subscribe((res: any) => {
                const pg_ports = res.data
                const minRange = -250;
                const maxRange = 250;
                const x = Math.floor(Math.random() * (maxRange - minRange) + minRange)
                const y = Math.floor(Math.random() * (maxRange - minRange) + minRange)
                const processors = {
                    "revision": {
                        "clientId": "",
                        "version": 0
                    },
                    "disconnectedNodeAcknowledged": "false",
                    "component": {
                        "type": processor_name,
                        "bundle": {
                            "group": "org.apache.nifi",
                            "artifact": "nifi-standard-nar",
                            "version": "1.12.1"
                        },
                        "name": name,
                        "position": {
                            "x": x,
                            "y": y
                        }
                    }
                }
                this.http.post<any>(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/process-groups/${pg_ports['processGroupFlow']['id']}/processors`, processors).subscribe((res: any) => {
                    if (res) {
                        console.log("Successfully created the processor", processor_name)
                        resolve('Successfully created the processor')
                    }
                    else {
                        console.log("Failed to create the processor", processor_name)
                        reject('Failed to create the processor')
                    }
                })
            })
        })
    }

    getProcessorSourceId(pg_source_id, processor_name) {
        return new Promise<any>(async (resolve, reject) => {
            const pg_ports = await this.getProcessorGroupPorts(pg_source_id)
            if (pg_ports) {
                pg_ports['processGroupFlow']['flow']['processors'].forEach((processor: any) => {
                    if (processor['component']['name'] == processor_name) {
                        resolve(processor['component']['id'])
                    }
                });
            }
        })
    }

    getProcessorGroupPorts(pg_source_id): any {
        return new Promise<any>((resolve, reject) => {
            this.http.get<any>(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/flow/process-groups/${pg_source_id}`).subscribe((res: any) => {
                resolve(res.data)
            })
        })
    }

    connect(sourceId, destinationId, relationship, pg_source_id) {
        return new Promise<any>(async (resolve, reject) => {
            const pg_ports = await this.getProcessorGroupPorts(pg_source_id)
            if (pg_ports) {
                const pg_id = pg_ports['processGroupFlow']['id']
                const json_body = {
                    "revision": {
                        "clientId": "",
                        "version": 0
                    },
                    "disconnectedNodeAcknowledged": "false",
                    "component": {
                        "name": "",
                        "source": {
                            "id": sourceId,
                            "groupId": pg_id,
                            "type": "PROCESSOR"
                        },
                        "destination": {
                            "id": destinationId,
                            "groupId": pg_id,
                            "type": "PROCESSOR"
                        },
                        "selectedRelationships": relationship
                    }
                }
                this.http.post<any>(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/process-groups/${pg_ports['processGroupFlow']['id']}/connections`, json_body).subscribe((res: any) => {
                    if (res) {
                        console.log(`Successfully connected the processor from ${sourceId} to ${destinationId}`)
                        resolve(`Successfully connected the processor from ${sourceId} to ${destinationId}`)
                    }
                    else {
                        console.log(`Failed to connect the processor`)
                        reject(`Successfully connected the processor from ${sourceId} to ${destinationId}`)
                    }
                })
            }
        })
    }

    updateProcessorProperty(pg_source_id, processor_name) {
        return new Promise<any>(async (resolve, reject) => {
            const pg_ports = await this.getProcessorGroupPorts(pg_source_id)
            if (pg_ports) {
                pg_ports['processGroupFlow']['flow']['processors'].forEach((processor) => {
                    if (processor['component']['name'] == processor_name) {
                        let update_processor_property_body
                        if (processor_name == 'generateFlowFile') {
                            update_processor_property_body = {
                                "component": {
                                    "id": processor['component']['id'],
                                    "name": processor['component']['name'],
                                    "config": {
                                        "autoTerminatedRelationships": [
                                            "original"
                                        ],
                                        "schedulingPeriod": "1 day"
                                    }
                                },
                                "revision": {
                                    "clientId": "",
                                    "version": processor['revision']['version']
                                },
                                "disconnectedNodeAcknowledged": "False"
                            }
                        }
                        else{
                            update_processor_property_body = {
                                "component": {
                                    "id": processor['component']['id'],
                                    "name": processor['component']['name'],
                                    "config": {
                                        "autoTerminatedRelationships": [
                                            "original"
                                        ],
                                        "properties": {
                                            "Command Arguments": 'kpi.py', //python transformer code needed
                                            "Command Path": "/opt/cqube/emission_app/flaskenv/bin/python",
                                            "Working Directory": "/opt/cqube/emission_app/python"
                                        }
                                    }
                                },
                                "revision": {
                                    "clientId": "",
                                    "version": processor['revision']['version']
                                },
                                "disconnectedNodeAcknowledged": "False"
                            }
                        }
                        this.http.put<any>(`${process.env.NIFI_IP}:${process.env.NIFI_PORT}/nifi-api/processors/${processor['component']['id']}`, update_processor_property_body).subscribe((res: any) => {
                            if (res) {
                                console.log(`Successfully updated the properties in the ${processor_name}`)
                                resolve(`Successfully updated the properties in the ${processor_name}`)
                            }
                            else {
                                console.log(`Failed to update the properties in the ${processor_name}`)
                                reject(`Failed to update the properties in the ${processor_name}`)
                            }
                        })
                    }
                });
            }
        })
    }

}
