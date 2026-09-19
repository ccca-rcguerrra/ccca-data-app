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
import { IndicatorsController } from './indicators/indicators.controller';
import { IndicatorsService } from './indicators/services/indicators.service';
import { IndicatorSavedFiltersService } from './indicators/services/indicator-saved-filters.service';
import { PermitReferencesController } from './permit-references/permit-references.controller';
import { PermitReferencesService } from './permit-references/services/permit-references.service';

@Module({
  imports: [ModelModule],
  controllers: [
    AutefsController,
    ForestGuidesController,
    PeopleController,
    SpeciesProductsController,
    HarvestUnitsController,
    AutefVolumeBalancesController,
    IndicatorsController,
    PermitReferencesController,
  ],
  providers: [
    AutefsService,
    ForestGuidesService,
    PeopleService,
    SpeciesProductsService,
    HarvestUnitsService,
    AutefVolumeBalancesService,
    IndicatorsService,
    IndicatorSavedFiltersService,
    PermitReferencesService,
  ],
  exports: [
    AutefsService,
    ForestGuidesService,
    PeopleService,
    SpeciesProductsService,
    HarvestUnitsService,
    AutefVolumeBalancesService,
    IndicatorsService,
    IndicatorSavedFiltersService,
    PermitReferencesService,
  ],
})
export class SemaspaModule {}
