import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ee = require('@google/earthengine');
import * as turf from '@turf/turf';
import { GeeService } from './gee.service';
import { GeeImageCollection, PlanetMapbiomasBand } from '../types/collections';
import { geeImageGetMap } from '../../shared/utils/rxjs-utils';
import { IGeeImageProvider, MapLayerData } from './interfaces/gee-image-provider.interface';

interface PlanetImage {
  name: string;
}

@Injectable()
export class GeePlanetScopeService implements IGeeImageProvider {
  private readonly logger = new Logger(GeePlanetScopeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly geeService: GeeService,
  ) {}

  async getImagesMosaic(
    resourceId: number,
    images: PlanetImage[],
    geometry: GeoJSON.Geometry,
    enhance: boolean = true,
  ): Promise<ee.Image> {
    const collectionPath =
      this.configService.get<string>('gee.planetCollection') ||
      GeeImageCollection.PlanetMapbiomas;

    const assetIds = images.map((image: PlanetImage) => {
      const assetId = `${collectionPath}/${resourceId}_${image.name}`;
      return assetId;
    });

    const imagesCollection = ee.ImageCollection.fromImages(
      assetIds.map((assetId) => ee.Image(assetId)),
    );

    let mosaic = imagesCollection.mosaic();

    if (enhance) {
      mosaic = await this.enhance(mosaic, geometry);
    }

    return mosaic;
  }

  /**
   * Gets map layer data from an Earth Engine image for visualization.
   * 
   * Uses the image.getMap() method to obtain map tile information including
   * mapid, token, and constructs the URL format for tile requests.
   *
   * @param image - Earth Engine Image (typically a processed mosaic)
   * @returns Promise with map layer data containing mapid, token, and urlFormat
   */
  async getMapLayer(image: ee.Image): Promise<{ mapid: string; token: string; urlFormat: string }> {
    // Image is already visualized in enhance() method, so minimal visParams needed
    return geeImageGetMap(image, {});
  }

  /**
   * Enhances a given EE image by:
   * - Selecting RGB bands from PlanetScope assets: R,G,B -> r,g,b
   * - Computing p2 and p98 percentiles for each channel over a region
   * - Stretching values to [0..255] using unitScale and converting to byte
   * - Visualizing the result and copying original properties
   *
   * @param image - EE image (mosaic)
   * @param featureCollection - Optional GeoJSON geometry used as region for stretch
   * @returns Enhanced EE image ready for visualization
   */
  private async enhance(image: ee.Image, geometry: GeoJSON.Geometry): Promise<ee.Image> {
    const imageRgb = image.select(
      [PlanetMapbiomasBand.Red, PlanetMapbiomasBand.Green, PlanetMapbiomasBand.Blue],
      ['r', 'g', 'b'],
    );

    delete geometry['crs'];

    const featCol = turf.featureCollection([turf.feature(geometry)])

    const region =
      ee.FeatureCollection(
        featCol.features.map((feature: any) => ee.Feature(feature))
      );

    const min = imageRgb.reduceRegion({
      reducer: ee.Reducer.percentile([2]),
      geometry: region,
      maxPixels: 1e13,
      scale: 30,
      bestEffort: true,
    });

    const max = imageRgb.reduceRegion({
      reducer: ee.Reducer.percentile([98]),
      geometry: region,
      maxPixels: 1e13,
      scale: 30,
      bestEffort: true,
    });

    const r = imageRgb
      .select('r')
      .unitScale(min.get('r'), max.get('r'))
      .multiply(255)
      .round()
      .byte();

    const g = imageRgb
      .select('g')
      .unitScale(min.get('g'), max.get('g'))
      .multiply(255)
      .round()
      .byte();

    const b = imageRgb
      .select('b')
      .unitScale(min.get('b'), max.get('b'))
      .multiply(255)
      .round()
      .byte();

    const imageEnhanced = ee.Image.cat([r, g, b])
      .rename(['r', 'g', 'b'])
      .visualize();

    return ee.Image(imageEnhanced.copyProperties(image));
  }
}
