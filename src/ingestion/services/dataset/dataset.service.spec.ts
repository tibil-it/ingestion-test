import { Test, TestingModule } from '@nestjs/testing';
import { DatasetService } from './dataset.service';
import { genricFunction } from '../gericFunction';
import { DatabaseService } from '../../../database/database.service';
describe('DatasetService', () => {
  let service: DatasetService;
  const mockDatabaseService = {
    executeQuery: jest.fn(dto =>{})
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, DatasetService, genricFunction,
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
          provide:DatasetService,
          useValue:{createDataset: jest.fn(),}
        }
      ],
    }).compile();
    service = module.get<DatasetService>(DatasetService);
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call an dataset api', async () => {
    const Datasetdto = {
      "dataset_name": "student_count_by_school_and_grade",
      "dataset": {
        "school_id": "6677",
        "grade": "t"
      }
    }
    expect(service.createDataset(Datasetdto)).toBeCalled;
  })
});
