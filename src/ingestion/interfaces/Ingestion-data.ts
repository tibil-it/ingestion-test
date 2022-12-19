export interface Dimension{
    dimension_name: string,
    dimension:JSON
}

export interface IEvent{
    event_name: string,
    event:JSON
}

export interface Dataset{
    dataset_name: string,
    dataset:JSON
}

export interface Pipeline{
    pipeline_name: string
    schedule_type: string
}