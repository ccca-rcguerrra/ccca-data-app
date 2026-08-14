import type { FeatureCollection } from 'geojson';
import ee = require('@google/earthengine');

export interface IGeeClassifier {
  classify(
    beforeMosaic: ee.Image,
    afterMosaic: ee.Image,
    boundary: FeatureCollection,
    deforestation: FeatureCollection,
    notDeforestation: FeatureCollection,
    params?: Record<string, any>,
  ): Promise<{ geometry: FeatureCollection }>;
}
