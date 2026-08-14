import { Injectable, Logger } from '@nestjs/common';
import ee = require('@google/earthengine');
import { GeeClassifierBase, ClassificationParams } from './gee-classifier.base';
import { PlanetMapbiomasBand } from '../types/collections';

const PLANET_BANDS = [
  PlanetMapbiomasBand.Blue, PlanetMapbiomasBand.Green,
  PlanetMapbiomasBand.Red, PlanetMapbiomasBand.NIR,
];

const FEATURE_SPACE = [
  PlanetMapbiomasBand.Blue, PlanetMapbiomasBand.Green, PlanetMapbiomasBand.Red, 'NDVI',
  'B_1', 'G_1', 'R_1', 'NDVI_1',
];

@Injectable()
export class GeeImagesMapBiomasPlanetClassifierService extends GeeClassifierBase {

  protected readonly logger = new Logger(GeeImagesMapBiomasPlanetClassifierService.name);

  protected readonly defaultParams: ClassificationParams = {
    scale: 4,
    nPoints: 3000,
    classValues: [1, 2],
    classPoints: [1500, 1500],
    seed: 1,
    nTrees: 100,
    featureSpace: FEATURE_SPACE,
    deforestationSize: 40,
    notDeforestationSize: 40,
  };

  protected prepareImages(before: ee.Image, after: ee.Image): [ee.Image, ee.Image] {
    return [
      this.addNDVI(before.select(PLANET_BANDS)),
      this.addNDVI(after.select(PLANET_BANDS)),
    ];
  }

  private addNDVI(image: ee.Image): ee.Image {
    const ndvi = image
      .expression('float(nir - red)/(nir + red)', {
        nir: image.select(['N']),
        red: image.select(['R']),
      })
      .add(1)
      .multiply(100)
      .toUint8();

    return image.addBands(ndvi.rename(['NDVI']));
  }
}
