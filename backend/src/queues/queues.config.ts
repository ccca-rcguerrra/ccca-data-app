import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const BullRootModule = BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const prefix = configService.get<string>('APP_REDIS_PREFIX');
    return {
      ...(prefix ? { prefix } : {}),
      redis: {
        host: configService.get<string>('APP_REDIS_HOST', 'localhost'),
        port: configService.get<number>('APP_REDIS_PORT', 6379),
        db: configService.get<number>('APP_REDIS_DB', 0),
        password: configService.get<string>('APP_REDIS_PASSWORD') || undefined,
      },
    };
  },
  inject: [ConfigService],
});
