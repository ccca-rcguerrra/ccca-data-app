import { Module } from '@nestjs/common';
import { GeeService } from './services/gee.service';
import { GeeImagesSentinel2Service } from './services/gee-images-sentinel2.service';
import { GeeImagesSentinel2TimeSeriesService } from './services/gee-images-sentinel2-timeseries.service';
import { GeePlanetScopeService } from './services/gee-images-mapbiomas-planet.service';
import { GeeImagesMapBiomasPlanetClassifierService } from './services/gee-images-mapbiomas-planet-classifier.service';
import { GeeImagesSentinel2ClassifierService } from './services/gee-images-sentinel2-classifier.service';
import { GeeComputePixelsService } from './services/gee-compute-pixels.service';
import { GeeController } from './gee.controller';

@Module({
  providers: [
    GeeService,
    GeeImagesSentinel2Service,
    GeeImagesSentinel2TimeSeriesService,
    GeePlanetScopeService,
    GeeImagesMapBiomasPlanetClassifierService,
    GeeImagesSentinel2ClassifierService,
    GeeComputePixelsService,
  ],
  controllers: [GeeController],
  exports: [
    GeeService,
    GeeImagesSentinel2Service,
    GeeImagesSentinel2TimeSeriesService,
    GeePlanetScopeService,
    GeeImagesMapBiomasPlanetClassifierService,
    GeeImagesSentinel2ClassifierService,
    GeeComputePixelsService,
  ],
})
export class GeeModule { }

