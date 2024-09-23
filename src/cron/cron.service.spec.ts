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
  let httpService: HttpService;
  let schedulerRegistry: SchedulerRegistry;

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

  test('should call rotina service and send notification', async () => {
    const spyPost = jest.spyOn(httpService, 'post').mockReturnValue(of(true as any));
    const spyDeleteCronJob = jest.spyOn(schedulerRegistry, 'deleteCronJob');
    await service.cronRotinas();
  
    // Verificando se foi chamado
    expect(spyPost).toHaveBeenCalledTimes(2);
  
    // Verificando a remoção fictícia do cron job
    expect(spyDeleteCronJob).toHaveBeenCalledWith('');
  });

  test('should initialize cron job on module init', () => {
    const spyAddCronJob = jest.spyOn(service, 'addCronJob'); // Espiona o método addCronJob

    service.onModuleInit(); // Chama o método que deve inicializar o cron job

    expect(spyAddCronJob).toHaveBeenCalledWith('cronRotinas', '0 * * * * *', expect.any(Function)); // Verifica se addCronJob foi chamado com os parâmetros corretos
  });
  
});

