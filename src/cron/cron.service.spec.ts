import { HttpModule, HttpService } from '@nestjs/axios';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Rotina } from '../rotina/entities/rotina.entity';
import { RotinaService } from '../rotina/rotina.service';
import { CronService } from './cron.service';

jest.mock('cron', () => {
  const mScheduleJob = { start: jest.fn(), stop: jest.fn() };
  const mCronJob = jest.fn(() => mScheduleJob);
  return { CronJob: mCronJob };
});

describe('CronService', () => {
  let service: CronService;
  let rotinaService: RotinaService;
  let schedulerRegistry: SchedulerRegistry;
  let httpService: HttpService;

  const rotina = {
    idIdoso: 1,
    titulo: 'titulo',
    descricao: 'desc',
    token: '',
    id: 1,
  };

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        {
          provide: RotinaService,
          useValue: {
            findAllToCron: jest.fn().mockResolvedValue([rotina]),
          },
        },
        {
          provide: getRepositoryToken(Rotina),
          useValue: mockRepository,
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addCronJob: jest.fn(),  // Mock para evitar erros com cron jobs
            deleteCronJob: jest.fn(),  // Mock para manipular a remoção de cron jobs
          },
        },
        CronService,
      ],
    }).compile();

    service = module.get<CronService>(CronService);
    httpService = module.get<HttpService>(HttpService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  
});
