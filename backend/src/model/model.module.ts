import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createTypeOrmConfig } from './typeorm.config';

import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Team } from './entities/team.entity';
import { TeamTerritory } from './entities/team-territory.entity';
import { UsersTeam } from './entities/users-team.entity';
import { Territory } from './entities/territory.entity';
import { CurrentTerritoryView } from './entities/current-territory.view.entity';
import { Comment } from './entities/comment.entity';
import { Notification } from './entities/notification.entity';
import { SemaspaAutef } from './entities/semaspa-autef.view.entity';
import { SemaspaForestGuide } from './entities/semaspa-forest-guide.view.entity';
import { SemaspaPerson } from './entities/semaspa-person.view.entity';
import { SemaspaSpeciesProduct } from './entities/semaspa-species-product.view.entity';
import { SemaspaHarvestUnit } from './entities/semaspa-harvest-unit.view.entity';
import { SemaspaAutefSpecies } from './entities/semaspa-autef-species.view.entity';
import { SemaspaForestGuideSpecies } from './entities/semaspa-forest-guide-species.view.entity';
import { SemaspaPersonRole } from './entities/semaspa-person-role.view.entity';
import { SemaspaAutefVolumeBalance } from './entities/semaspa-autef-volume-balance.view.entity';
import { SemaspaAutefForestGuide } from './entities/semaspa-autef-forest-guide.view.entity';
import { SemaspaAutefHarvestUnit } from './entities/semaspa-autef-harvest-unit.view.entity';

const features = [
  User,
  UserRole,
  Team,
  TeamTerritory,
  UsersTeam,
  Territory,
  CurrentTerritoryView,
  Comment,
  Notification,
  SemaspaAutef,
  SemaspaForestGuide,
  SemaspaPerson,
  SemaspaSpeciesProduct,
  SemaspaHarvestUnit,
  SemaspaAutefSpecies,
  SemaspaForestGuideSpecies,
  SemaspaPersonRole,
  SemaspaAutefVolumeBalance,
  SemaspaAutefForestGuide,
  SemaspaAutefHarvestUnit,
];

const ModelFeatures = TypeOrmModule.forFeature(features);

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        createTypeOrmConfig(configService),
      inject: [ConfigService],
    }),
    ModelFeatures,
  ],
  exports: [ModelFeatures],
})
export class ModelModule {}
