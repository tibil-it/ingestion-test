import { Test, TestingModule } from '@nestjs/testing';
import { genricFunction } from '../gericFunction';
import { EventService } from './event.service';
import { DatabaseService } from '../../../database/database.service';
describe('EventService', () => {
  let service: EventService;
  const mockIngestionService = {
    createEvent: jest.fn(),
  }
  const mockDatabaseService = {
    getDataset: jest.fn(),
    executeQuery: jest.fn(dto =>{dto})
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService,EventService,genricFunction,
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
    service = module.get<EventService>(EventService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should call an event api', () => {
    const eventData = {
      "event_name": "student_count",
      "event": {
        "school_id": "201",
        "grade": "1",
        "count": "10"
      }
    }
    expect(service.createEvent(eventData)).toBeCalled
  })
});
