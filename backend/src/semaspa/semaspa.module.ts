import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';
import { AutefsController } from './autefs/autefs.controller';
import { AutefsService } from './autefs/services/autefs.service';
import { ForestGuidesController } from './forest-guides/forest-guides.controller';
import { ForestGuidesService } from './forest-guides/services/forest-guides.service';
import { PeopleController } from './people/people.controller';
import { PeopleService } from './people/services/people.service';
import { SpeciesProductsController } from './species-products/species-products.controller';
import { SpeciesProductsService } from './species-products/services/species-products.service';
import { HarvestUnitsController } from './harvest-units/harvest-units.controller';
import { HarvestUnitsService } from './harvest-units/services/harvest-units.service';
import { AutefVolumeBalancesController } from './autef-volume-balances/autef-volume-balances.controller';
import { AutefVolumeBalancesService } from './autef-volume-balances/services/autef-volume-balances.service';

@Module({
  imports: [ModelModule],
  controllers: [
    AutefsController,
    ForestGuidesController,
    PeopleController,
    SpeciesProductsController,
    HarvestUnitsController,
    AutefVolumeBalancesController,
  ],
  providers: [
    AutefsService,
    ForestGuidesService,
    PeopleService,
    SpeciesProductsService,
    HarvestUnitsService,
    AutefVolumeBalancesService,
  ],
  exports: [
    AutefsService,
    ForestGuidesService,
    PeopleService,
    SpeciesProductsService,
    HarvestUnitsService,
    AutefVolumeBalancesService,
  ],
})
export class SemaspaModule {}
