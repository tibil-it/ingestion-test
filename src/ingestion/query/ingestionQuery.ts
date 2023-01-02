export const IngestionDatasetQuery = {
    async getDataset(datasetName) {
        const queryStr = `SELECT dataset_data FROM spec.dataset WHERE dataset_name = $1`;
        return {query: queryStr, values: [datasetName]};
    },
    async getDimesnsion(dimensionName) {
        const queryStr = `SELECT dimension_data FROM spec.dimension WHERE dimension_name = $1`;
        return {query: queryStr, values: [dimensionName]};
    },
    async getEvents(eventName) {
        const queryStr = `SELECT event_data FROM spec.event WHERE event_name = $1`;
        return {query: queryStr, values: [eventName]};
    },
    async getPipelineSpec(pipelineName) {
        const queryStr = `SELECT transformer_file, event_name, dataset_name
        FROM spec.pipeline
        LEFT JOIN spec.event ON event.pid = pipeline.event_pid
        LEFT JOIN spec.dataset ON dataset.pid  = pipeline.dataset_pid
        LEFT JOIN spec.transformer ON transformer.pid = pipeline.transformer_pid
        WHERE pipeline_name = $1`;
        return {query: queryStr, values: [pipelineName]};
    }
};