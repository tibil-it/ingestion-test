import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { DatasetService } from '../services/dataset/dataset.service';
import { DimensionService } from '../services/dimension/dimension.service';
import { EventService } from '../services/event/event.service';
import { PipelineService } from '../services/pipeline/pipeline.service';;
describe('IngestionController', () => {
  let controller: IngestionController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [DatasetService,
        DimensionService, EventService,PipelineService,
        {
          provide: DatasetService,
          useValue: {
            createDataset: jest.fn(dto =>{dto}),
          }
        },
        {
          provide: DimensionService,
          useValue: {
            createDimenshion:jest.fn(dto =>{dto}),
          }
        },
        {
          provide: EventService,
          useValue: {
            createEvent:jest.fn(dto =>{dto}),
          }
        },
        {
          provide: PipelineService,
          useValue: { pipeline:jest.fn(dto =>{dto})}
        }
      ],
    }).compile();
    controller = module.get<IngestionController>(IngestionController);
  });
  
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
