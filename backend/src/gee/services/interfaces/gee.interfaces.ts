import * as ee from '@google/earthengine';
import { GeeImageFilterParams } from '../../types';

/**
 * Common interface for GEE image services
 */
export interface IGeeImageService {
    /**
     * Filter images from collection
     * @param params - Filter parameters
     * @returns ImageCollection filtered by parameters
     */
    filter(params: GeeImageFilterParams): ee.ImageCollection;

    /**
     * Get image collection info
     * @param params - Filter parameters
     * @returns Collection metadata
     */
    getCollectionInfo(params: GeeImageFilterParams): Promise<any>;
}

