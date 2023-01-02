import { Test, TestingModule } from '@nestjs/testing';
import { PipelineService } from './pipeline.service';
import { genricFunction } from '../gericFunction';
import { DatabaseService } from '../../../database/database.service';
import { HttpService } from '@nestjs/axios';
describe('PipelineService', () => {
  let service: PipelineService;
  const mockIngestionService = {
    pipeline: jest.fn(),
  }
  const mockDatabaseService = {
    getDataset: jest.fn(),
    executeQuery: jest.fn(dto =>{dto})
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService,PipelineService,genricFunction,HttpService,
        {
          provide: HttpService,
          useValue: {}
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService
        },
        {
          provide: genricFunction,
          useValue: {
            ajvValidator:jest.fn(),
            writeToCSVFile:jest.fn()
          }
        },
        {
          provide:PipelineService,
          useValue:mockIngestionService
        },
      ],
    }).compile();
    service = module.get<PipelineService>(PipelineService);
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("should call an pipeline api", () => {
    const pipelinedata = {
      "pipeline_name": "student_count_pipe",
      "schedule_type": "dimension_to_db/ingest_to_aggregate/aggregate_to_dataset"
    }
    expect(service.pipeline(pipelinedata)).toBeCalled 
  })
});
