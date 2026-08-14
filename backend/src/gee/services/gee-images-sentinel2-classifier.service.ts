import { Injectable, Logger } from '@nestjs/common';
import ee = require('@google/earthengine');
import { GeeClassifierBase, ClassificationParams } from './gee-classifier.base';
import { S2SrHarmonizedBand } from '../types/collections';

const SENTINEL_BANDS = [
  S2SrHarmonizedBand.Blue, S2SrHarmonizedBand.Green, S2SrHarmonizedBand.Red,
  S2SrHarmonizedBand.NIR, S2SrHarmonizedBand.SWIR1, S2SrHarmonizedBand.SWIR2,
];

const FEATURE_SPACE = [
  S2SrHarmonizedBand.Blue,   S2SrHarmonizedBand.Green,  S2SrHarmonizedBand.Red,
  S2SrHarmonizedBand.NIR,    S2SrHarmonizedBand.SWIR1,  S2SrHarmonizedBand.SWIR2,
  'B2_1', 'B3_1', 'B4_1', 'B8_1', 'B11_1', 'B12_1',
];

@Injectable()
export class GeeImagesSentinel2ClassifierService extends GeeClassifierBase {

  protected readonly logger = new Logger(GeeImagesSentinel2ClassifierService.name);

  protected readonly defaultParams: ClassificationParams = {
    scale: 1,
    nPoints: 200,
    classValues: [1, 2],
    classPoints: [100, 100],
    seed: 1,
    nTrees: 20,
    featureSpace: FEATURE_SPACE,
    deforestationSize: 50,
    notDeforestationSize: 50,
  };

  protected prepareImages(before: ee.Image, after: ee.Image): [ee.Image, ee.Image] {
    return [
      before.select(SENTINEL_BANDS),
      after.select(SENTINEL_BANDS),
    ];
  }
}
