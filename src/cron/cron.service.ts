import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { CronJob } from 'cron';
import { lastValueFrom } from 'rxjs';
import { Rotina } from '../rotina/entities/rotina.entity';
import { RotinaService } from '../rotina/rotina.service';

@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly rotinaService: RotinaService,
    private readonly httpService: HttpService,
  ) { }

  onModuleInit(): void {
    this.initCronJobRotinas();
  }

  private initCronJobRotinas(): void {
    const jobName = 'cronRotinas';
    const cronExpression = '0 * * * * *'; // Executa a cada minuto (ajuste conforme necessário)

    if (!this.schedulerRegistry.getCronJobs().has(jobName)) {
      this.addCronJob(jobName, cronExpression, this.cronRotinas.bind(this));
      this.logger.log(`Cron Job "${jobName}" inicializado.`);
    } else {
      this.logger.warn(`Cron Job "${jobName}" já está registrado.`);
    }
  }

  addCronJob(
    name: string,
    cronExpression: string,
    callback: () => void | Promise<void>,
  ): void {
    const job = new CronJob(cronExpression, callback);

    this.schedulerRegistry.addCronJob(name, job);
    job.start();
    this.logger.log(`Cron Job "${name}" adicionado e iniciado.`);
  }

  async cronRotinas(): Promise<void> {
    this.logger.log('CRONRotinas - Procurando rotinas...');
    const rotinas = await this.rotinaService.findAllToCron();

    if (rotinas.length > 0) {
      this.logger.log(
        `CRONRotinas - ${rotinas.length} rotinas encontradas! Enviando notificações...`,
      );

      const promises: Promise<AxiosResponse>[] = rotinas.map((rotina: Rotina) =>
        lastValueFrom(
          this.httpService.post('https://exp.host/--/api/v2/push/send', {
            to: rotina.token,
            sound: 'default',
            title: rotina.titulo,
            body: rotina.descricao,
            data: {
              id: rotina.id,
            },
          }),
        ),
      );

      await Promise.all(promises);
      this.logger.log('CRONRotinas - Notificações enviadas!');
    } else {
      this.logger.warn('CRONRotinas - Nenhuma rotina encontrada.');
    }

    // Deleta o Cron Job apenas se necessário
    const jobName = 'cronRotinas';
    if (this.schedulerRegistry.getCronJobs().has(jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
      this.logger.log(`Cron Job "${jobName}" foi deletado.`);
    }
  }
}
