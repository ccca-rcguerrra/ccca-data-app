import * as ee from '@google/earthengine';

export * from './sentinel-visualization.enum';

/**
 * Common type for filtering images in Google Earth Engine
 */
export type GeeImageFilterParams = {
    startDate: string;
    endDate: string;
    geometry?: ee.Geometry;
    cloudCoverPercentage?: number;
    maxResults?: number;
    cloudMask?: boolean;
};

