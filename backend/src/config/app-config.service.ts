import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigDto } from './dto/app-config.dto';
import { InitiativePublicMetadataDto } from './dto/initiative-public-metadata.dto';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  getAppConfig(): AppConfigDto {
    return {
      id: this.configService.get<string>('appConfig.id') ?? 'default',
      name: this.configService.get<string>('appConfig.name') ?? 'Workspace',
      country:
        this.configService.get<string>('appConfig.country') ?? '',
      countryCode:
        this.configService.get<string>('appConfig.countryCode') ?? '',
      locale:
        this.configService.get<string>('appConfig.locale') ?? 'en-US',
      defaultLanguage:
        this.configService.get<string>('appConfig.defaultLanguage') ?? 'en',
    };
  }

  getPublicMetadata(): InitiativePublicMetadataDto {
    const appConfig = this.configService.getOrThrow<AppConfigDto>('appConfig');

    return {
      id: appConfig.id,
      name: appConfig.name,
      country: appConfig.country,
      countryCode: appConfig.countryCode,
      locale: appConfig.locale,
      defaultLanguage: appConfig.defaultLanguage,
    };
  }
}
