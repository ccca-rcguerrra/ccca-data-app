import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainProducer } from './domain.producer';

@Injectable()
export class DomainScheduler {
  private readonly logger = new Logger(DomainScheduler.name);

  constructor(
    private readonly producer: DomainProducer,
    private readonly configService: ConfigService,
  ) {}

  private get isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleHourly(): Promise<void> {
    if (!this.isProduction) return;
    this.logger.debug('Enqueuing hourly job...');
    await this.producer.addHourlyJob();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scheduleDaily(): Promise<void> {
    if (!this.isProduction) return;
    this.logger.debug('Enqueuing daily job...');
    await this.producer.addDailyJob();
  }
}
