import { Logger } from '@nestjs/common';
import ee = require('@google/earthengine');
import type { FeatureCollection, Geometry } from 'geojson';
import { geeEvaluate } from '../../shared/utils/rxjs-utils';
import { IGeeClassifier } from './interfaces/gee-classifier.interface';

export interface ClassificationParams {
  scale: number;
  nPoints: number;
  classValues: number[];
  classPoints: number[];
  seed: number;
  nTrees: number;
  featureSpace: string[];
  deforestationSize: number;
  notDeforestationSize: number;
}

export abstract class GeeClassifierBase implements IGeeClassifier {

  protected abstract readonly logger: Logger;
  protected abstract readonly defaultParams: ClassificationParams;

  /**
   * Prepare before/after images for classification.
   * Each subclass applies its own band selection or index computation.
   * Returns a tuple [preparedBefore, preparedAfter].
   */
  protected abstract prepareImages(
    before: ee.Image,
    after: ee.Image,
  ): [ee.Image, ee.Image];

  // ── Shared geometry utilities ────────────────────────────────────────────

  protected geojsonGeometryToEeGeometry(geom: Geometry): ee.Geometry {
    return ee.Geometry(geom as any, 'EPSG:4326', true, null, false);
  }

  protected toEeFeatureCollection(fc: FeatureCollection): ee.FeatureCollection {
    return ee.FeatureCollection(
      (fc.features ?? []).map((f) => {
        const eeGeom = this.geojsonGeometryToEeGeometry(f.geometry as any);
        return ee.Feature(eeGeom, (f.properties ?? {}) as any);
      }),
    );
  }

  // ── Shared classification steps ──────────────────────────────────────────

  protected spatialFilterApply(
    classification: ee.Image,
    deforestationSize: number,
    notDeforestationSize: number,
  ): ee.Image {
    const noiseDeforestation = classification.mask(classification.eq(1))
      .connectedComponents(ee.Kernel.circle(3), deforestationSize)
      .select('labels');

    const noiseNotDeforestation = classification.mask(classification.eq(2))
      .connectedComponents(ee.Kernel.circle(3), notDeforestationSize)
      .select('labels');

    classification = classification.where(noiseDeforestation.neq(0), 2);
    classification = classification.where(noiseNotDeforestation.neq(0), 1);

    return classification;
  }

  protected samplingPoints(
    image: ee.Image,
    samplesPolygons: ee.FeatureCollection,
    scale: number,
    nPoints: number,
    classValues: number[],
    classPoints: number[],
    seed: number,
  ): ee.FeatureCollection {
    const samplesRaster = ee.Image()
      .int16()
      .paint({ featureCollection: samplesPolygons, color: 'classe' })
      .rename(['classe']);

    return samplesRaster
      .addBands(image)
      .stratifiedSample({
        numPoints: nPoints,
        classBand: 'classe',
        region: samplesPolygons.geometry(),
        scale,
        seed,
        classValues,
        classPoints,
        dropNulls: true,
      });
  }

  protected rasterToVector(
    raster: ee.Image,
    classe: number,
    geometry: ee.Geometry,
    scale: number,
  ): ee.FeatureCollection {
    const vector = raster.reduceToVectorsStreaming({
      geometry,
      scale,
      geometryType: 'polygon',
      bestEffort: true,
      maxPixels: 1e13,
      tileScale: 4,
    });

    const filtered = ee.FeatureCollection(vector.filter(ee.Filter.eq('label', classe)));
    return ee.FeatureCollection(ee.Feature(filtered.geometry()));
  }

  // ── Template method ──────────────────────────────────────────────────────

  async classify(
    beforeMosaic: ee.Image,
    afterMosaic: ee.Image,
    boundaryFeatureCollection: FeatureCollection,
    deforestationFeatureCollection: FeatureCollection,
    notDeforestationFeatureCollection: FeatureCollection,
    classificationParams?: Partial<ClassificationParams>,
  ): Promise<{ geometry: FeatureCollection }> {

    const params: ClassificationParams = {
      ...this.defaultParams,
      ...(classificationParams ?? {}),
    };

    const deforestationClasse = 1;
    const notDeforestationClasse = 2;

    try {
      const boundary = this.toEeFeatureCollection(boundaryFeatureCollection);
      const region = boundary.geometry().transform('EPSG:4326', 1);

      const deforestationSamples = this.toEeFeatureCollection(deforestationFeatureCollection)
        .map((f: ee.Feature) => f.set('classe', deforestationClasse));

      const notDeforestationSamples = this.toEeFeatureCollection(notDeforestationFeatureCollection)
        .map((f: ee.Feature) => f.set('classe', notDeforestationClasse));

      const samples = deforestationSamples.merge(notDeforestationSamples);

      const [before, after] = this.prepareImages(beforeMosaic, afterMosaic);
      const imageChange = before.addBands(after);

      const trainingData = this.samplingPoints(
        imageChange,
        samples,
        params.scale,
        params.nPoints,
        params.classValues,
        params.classPoints,
        params.seed,
      );

      const classifier = ee.Classifier.smileRandomForest(params.nTrees, 1)
        .train(trainingData, 'classe', params.featureSpace);

      let classified = imageChange.classify(classifier);

      classified = this.spatialFilterApply(
        classified,
        params.deforestationSize,
        params.notDeforestationSize,
      );

      const refinedAlertEe = this.rasterToVector(classified, deforestationClasse, region, params.scale);
      const geometry = await geeEvaluate<FeatureCollection>(refinedAlertEe);

      return { geometry };
    } catch (error: any) {
      this.logger.error('Classification failed', error?.stack ?? error);
      return { geometry: boundaryFeatureCollection };
    }
  }
}
