import { Module } from '@nestjs/common';
import { AppConfigController } from './app-config.controller';
import { AppConfigService } from './app-config.service';
import { InitiativePublicMetadataController } from './initiative-public-metadata.controller';

/**
 * Serves the per-initiative AppConfig to the frontend.
 *
 * Phase 0: env/arquivo only (ConfigModule is global). Phase 1+ will import
 * ModelModule to read the alert class catalog from the database.
 */
@Module({
  controllers: [AppConfigController, InitiativePublicMetadataController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
