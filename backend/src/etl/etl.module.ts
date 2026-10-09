import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EtlClient } from './etl.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>(
          'ETL_API_URL',
          'http://localhost:8000',
        ),
        timeout: 15000,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EtlClient],
  exports: [EtlClient],
})
export class EtlModule {}
