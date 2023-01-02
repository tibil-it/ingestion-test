import { Test, TestingModule } from '@nestjs/testing';
import { DimensionService } from './dimension.service';
import { genricFunction } from '../gericFunction';
import { DatabaseService } from '../../../database/database.service';
describe('DimensionService', () => {
  let service: DimensionService;
  const mockIngestionService = {
    createDimenshion: jest.fn(),
  }
  const mockDatabaseService = {
    getDataset: jest.fn(),
    executeQuery: jest.fn(dto =>{dto})
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService,DimensionService,genricFunction,
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
        }],
    }).compile();
    service = module.get<DimensionService>(DimensionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  it('should call an dimension api', () => {
    const dimesionData = {
      "dimension_name": "district",
      "dimension": {
        "name": "jhaha",
        "district_id": "SH123"
      }
    }
    expect(service.createDimenshion(dimesionData)).toBeCalled
  })
});
