import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import ee = require('@google/earthengine');
import { from, lastValueFrom, mergeMap, toArray } from 'rxjs';
import type { Geometry } from 'geojson';
import { GeeService } from './gee.service';
import { GeeImageCollection, S2SrHarmonizedBand, S2SrHarmonizedImageProperty } from '../types/collections';
import { GeeImageFilterParams } from '../types';
import { geeGetInfo } from '../../shared/utils/rxjs-utils';
import { RedisService } from '../../shared/redis/redis.service';
import { REDIS_KEYS } from '../../shared/redis/redis.keys';
import { REDIS_TTL } from '../../shared/redis/redis.constants';

type SpectralIndex = 'NDVI' | 'NBR' | 'NDMI';

/** Temporal aggregation step for the time series (one data point per period). */
type TemporalResolution = 'day' | 'week' | 'month';

/** One materialized point of the time series. */
type TimeSeriesPoint = { date: string; values: Array<number | null>; count: number };

/**
 * One materialized point of the timeline summary: per-period NDVI (mean over the
 * AOI), mean scene cloud cover and image count. Used to drive the data heatmap
 * under the map timeline slider so analysts can pick a clear, change-bearing month.
 */
type TimelineSummaryPoint = {
    date: string;
    ndvi: number | null;
    cloud: number | null;
    count: number;
};

// Chunking thresholds (env-tunable). A long daily range produces hundreds of
// per-period reduceRegion ops; evaluating them in one getInfo can hit the GEE
// timeout. Above CHUNK_THRESHOLD periods we split into index ranges of up to
// CHUNK_SIZE and evaluate them concurrently (real parallelism is still capped by
// the shared pLimit inside geeGetInfo). MAX_CHUNKS bounds the fan-out so a huge
// range can't starve other GEE endpoints.
const CHUNK_THRESHOLD = Number(process.env.APP_GEE_TS_CHUNK_THRESHOLD) || 120;
const CHUNK_SIZE = Number(process.env.APP_GEE_TS_CHUNK_SIZE) || 90;
const MAX_CHUNKS = Number(process.env.APP_GEE_TS_MAX_CHUNKS) || 12;

// How many chunk requests this service runs at once. Owned here on purpose (via
// RxJS mergeMap concurrency below), so the fan-out stays bounded regardless of
// whatever limiter geeGetInfo/rxjs-utils may (or may not) apply in the future.
// When both are active the effective concurrency is the smaller of the two —
// defensive, never harmful.
const TS_CONCURRENCY = Number(process.env.APP_GEE_TS_CONCURRENCY) || 4;

@Injectable()
export class GeeImagesSentinel2TimeSeriesService {
    private readonly logger = new Logger(GeeImagesSentinel2TimeSeriesService.name);

    constructor(
        private readonly geeService: GeeService,
        private readonly redis: RedisService,
    ) { }

    /**
     * Build a deterministic cache key from the params that fully determine a GEE
     * result. Object keys are sorted so equivalent requests hash equally.
     */
    private cacheKey(params: Record<string, unknown>): string {
        const stable = JSON.stringify(params, (_key, value) =>
            value && typeof value === 'object' && !Array.isArray(value)
                ? Object.keys(value)
                    .sort()
                    .reduce(
                        (acc, k) => {
                            acc[k] = (value as Record<string, unknown>)[k];
                            return acc;
                        },
                        {} as Record<string, unknown>,
                    )
                : value,
        );
        return createHash('sha1').update(stable).digest('hex');
    }

    /**
     * Convert GeoJSON Geometry to Earth Engine Geometry
     * @param geometry - GeoJSON Geometry
     * @returns Earth Engine Geometry
     */
    private geojsonGeometryToEeGeometry(geometry: Geometry): ee.Geometry {
        // evenOdd=false to avoid "Even/odd interiors..." error in unsupported projections
        return ee.Geometry(geometry as any, 'EPSG:4326', true, null, false);
    }

    /**
     * Mask clouds and cirrus using QA60 band (bits 10 and 11)
     * @param img - Sentinel-2 image
     * @returns Masked image
     */
    private maskS2QA60(img: ee.Image): ee.Image {
        const qa = img.select(S2SrHarmonizedBand.QA60);
        const cloudBitMask = 1 << 10;
        const cirrusBitMask = 1 << 11;
        const mask = qa.bitwiseAnd(cloudBitMask).eq(0)
            .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
        return img.updateMask(mask);
    }

    /**
     * Add requested spectral indexes as bands and select only those indexes.
     * Indexes:
     * - NDVI: (B8 - B4) / (B8 + B4)
     * - NBR:  (B8 - B12) / (B8 + B12)
     * - NDMI: (B8 - B11) / (B8 + B11)  (a.k.a. NDWI-Gao; vegetation moisture)
     * @param img - Sentinel-2 image
     * @param indexes - List of indexes to compute
     * @returns Image with index bands (only requested indexes)
     */
    private addIndexes(img: ee.Image, indexes: SpectralIndex[]): ee.Image {
        const ndvi = img.normalizedDifference([S2SrHarmonizedBand.NIR,   S2SrHarmonizedBand.Red  ]).rename('NDVI');
        const nbr  = img.normalizedDifference([S2SrHarmonizedBand.NIR,   S2SrHarmonizedBand.SWIR2]).rename('NBR');
        const ndmi = img.normalizedDifference([S2SrHarmonizedBand.NIR,   S2SrHarmonizedBand.SWIR1]).rename('NDMI');

        const withAll = img.addBands([ndvi, nbr, ndmi]);

        return withAll.select(indexes);
    }

    /**
     * Calculate mean time series for one or more spectral indexes from Sentinel-2 images.
     * Creates one feature per period (day, week or month) with mean values for the requested indexes.
     * Uses cloud masking via QA60 and aggregates multiple images within a period using median.
     * @param params - Filter parameters (geometry is required as GeoJSON.Geometry)
     * @param params.indexes - List of indexes to compute (e.g. ['NDVI','NBR','NDMI'])
     * @param params.temporalResolution - Aggregation step: 'day' (default), 'week' or 'month'
     * @param scale - Scale in meters for index calculation (default: 10)
     * @returns Time series array with date (period start) and values (same order as params.indexes)
     *
     * Behavior for missing values:
     * - If there are no images in the period: values = [null, null, ...] (length == indexes.length)
     * - If an index has no valid pixels in AOI in that period: that position is null, but the period is kept
     *
     * Extra fields:
     * - count: number of images available in that period (after filters/masking pipeline)
     */
    async getIndexesTimeSeries(
        params: GeeImageFilterParams & {
            geometry: Geometry;
            scale?: number;
            indexes: SpectralIndex[];
            temporalResolution?: TemporalResolution;
        },
    ): Promise<Array<{ date: string; values: Array<number | null>; count: number }>> {
        if (!this.geeService.isReady()) {
            throw new Error('GEE is not initialized. Please wait for initialization to complete.');
        }

        if (!params.indexes || params.indexes.length === 0) {
            throw new Error('params.indexes is required and must contain at least one index (NDVI, NBR, NDMI).');
        }

        const unit: TemporalResolution = params.temporalResolution || 'day';

        this.logger.log(
            `Calculating ${unit} indexes time series [${params.indexes.join(', ')}] from ${params.startDate} to ${params.endDate}`
        );

        const aoi = this.geojsonGeometryToEeGeometry(params.geometry);
        const scale = params.scale || 10;

        const indexes = params.indexes;

        let s2 = ee.ImageCollection(GeeImageCollection.S2SrHarmonized)
            .filterBounds(aoi)
            .filterDate(params.startDate, params.endDate);

        if (params.cloudCoverPercentage !== undefined) {
            s2 = s2.filter(
                ee.Filter.lte(S2SrHarmonizedImageProperty.CloudyPixelPercentage, params.cloudCoverPercentage)
            );
        }

        const s2Indexes = s2
            .map((img: ee.Image) => this.maskS2QA60(img))
            .map((img: ee.Image) => this.addIndexes(img, indexes));

        const start = ee.Date(params.startDate);
        const end = ee.Date(params.endDate);

        // Total number of periods, computed exactly the way a single run would
        // (ceil() includes the last partial period). One cheap scalar getInfo so
        // chunk boundaries become pure integer index ranges — there is no JS/GEE
        // date-math mismatch (month advance/clamping stays on the GEE side, and
        // every period is start.advance(globalIndex, unit) just like a single run).
        const nPeriods = await geeGetInfo<number>(
            end.difference(start, unit).ceil().toInt(),
        );

        if (!nPeriods || nPeriods <= 0) {
            this.logger.log('No periods in the requested range');
            return [];
        }

        // Small ranges stay a single request (no regression). Large ranges fan
        // out and run concurrently — geeGetInfo already caps real parallelism via
        // the shared pLimit.
        const ranges = this.splitPeriodRange(nPeriods);

        this.logger.log(
            `Time series spans ${nPeriods} ${unit} period(s) → ${ranges.length} GEE request(s) ` +
            `(concurrency ${TS_CONCURRENCY})`
        );

        // Fan out with RxJS: mergeMap's concurrency arg keeps at most TS_CONCURRENCY
        // chunk requests in flight at once, owned by this service and independent of
        // rxjs-utils internals. Emission order is completion order (not input order),
        // which is fine — the merged points are sorted by date below.
        const chunkResults = await lastValueFrom(
            from(ranges).pipe(
                mergeMap(
                    ([fromIndex, toIndex]) =>
                        this.extractPeriodRange({ s2Indexes, aoi, scale, indexes, unit, start, fromIndex, toIndex }),
                    TS_CONCURRENCY,
                ),
                toArray(),
            ),
        );

        const timeSeries = chunkResults
            .flat()
            .sort((a, b) => a.date.localeCompare(b.date));

        this.logger.log(`Calculated indexes time series with ${timeSeries.length} points`);

        return timeSeries;
    }

    /**
     * Split [0, nPeriods) into contiguous index ranges. Below the threshold it is
     * a single range (current behavior). Otherwise it uses CHUNK_SIZE, growing the
     * chunk size if needed so the number of sub-requests never exceeds MAX_CHUNKS.
     */
    private splitPeriodRange(nPeriods: number): Array<[number, number]> {
        if (nPeriods <= CHUNK_THRESHOLD) {
            return [[0, nPeriods]];
        }

        let size = CHUNK_SIZE;
        if (Math.ceil(nPeriods / size) > MAX_CHUNKS) {
            size = Math.ceil(nPeriods / MAX_CHUNKS);
        }

        const ranges: Array<[number, number]> = [];
        for (let i = 0; i < nPeriods; i += size) {
            ranges.push([i, Math.min(i + size, nPeriods)]);
        }
        return ranges;
    }

    /**
     * Compute the time series for a contiguous range of GLOBAL period indices
     * [fromIndex, toIndex). Each period date is `start.advance(globalIndex, unit)`,
     * so a chunked run is identical (same dates) to a single run — chunks differ
     * only in which index range they evaluate. Runs as one getInfo per chunk.
     */
    private async extractPeriodRange(opts: {
        s2Indexes: ee.ImageCollection;
        aoi: ee.Geometry;
        scale: number;
        indexes: SpectralIndex[];
        unit: TemporalResolution;
        start: ee.Date;
        fromIndex: number;
        toIndex: number;
    }): Promise<TimeSeriesPoint[]> {
        const { s2Indexes, aoi, scale, indexes, unit, start, fromIndex, toIndex } = opts;
        const meanReducer = ee.Reducer.mean();

        /**
         * Create one feature per period (day/week/month).
         * - If there are no images in the period: values = [-9999...]
         * - If an index has no valid pixels: that position is -9999
         * @param i - GLOBAL period offset from the original start date (in `unit` steps)
         * @returns Period ee.Feature
         */
        const createPeriodFeature = (i: ee.Number): ee.Feature => {
            const dayStart = start.advance(i, unit);
            const dayEnd = dayStart.advance(1, unit);

            const dayCol = s2Indexes.filterDate(dayStart, dayEnd);
            const count = dayCol.size();

            const values = ee.Algorithms.If(
                count.gt(0),
                (function () {
                    const dayImg = dayCol.median();

                    const stats = ee.Dictionary(
                        dayImg.reduceRegion({
                            reducer: meanReducer,
                            geometry: aoi,
                            scale: scale,
                            bestEffort: true,
                            maxPixels: 1e13,
                        })
                    );

                    const bands = ee.List(indexes as any);

                    // IMPORTANT:
                    // Mesmo com stats.contains(b) == true, stats.get(b) pode ser null.
                    // Então aqui garantimos que NUNCA retornamos null dentro do array: usamos -9999 como placeholder.
                    const vals = bands.map((b: ee.String) => {
                        const hasKey = stats.contains(b);
                        const rawVal = stats.get(b);

                        const safeVal = ee.Algorithms.If(
                            ee.Algorithms.IsEqual(rawVal, null),
                            -9999,
                            rawVal
                        );

                        return ee.Algorithms.If(hasKey, safeVal, -9999);
                    });

                    return vals;
                })(),
                // No images in the period -> return [-9999, -9999, ...] with same length as indexes
                ee.List.repeat(-9999, indexes.length)
            );

            return ee.Feature(null, {
                date: dayStart.format('YYYY-MM-dd'),
                values: values,
                count: count,
            }).set('system:time_start', dayStart.millis());
        };

        /**
         * Filter out periods where ALL indexes are missing (-9999 for every position).
         * Must use function declaration (not arrow) for Earth Engine serialization stability.
         * @param feature - Period feature
         * @returns Feature with _hasValidData flag
         */
        function filterAllMissing(feature: ee.Feature): ee.Feature {
            const values = ee.List(feature.get('values'));

            const missingCount = ee.Number(
                values
                    .map((v: ee.ComputedObject) => {
                        // v aqui é garantidamente número (-9999 ou valor), sem null
                        const isMissing = ee.Number(v).eq(-9999);
                        return ee.Algorithms.If(isMissing, 1, 0);
                    })
                    .reduce(ee.Reducer.sum())
            );

            const total = ee.Number(values.length());
            const allMissing = missingCount.eq(total);

            return ee.Feature(feature).set('_hasValidData', ee.Algorithms.If(allMissing, 0, 1));
        }

        const periodFeatures = ee.FeatureCollection(
            ee.List.sequence(fromIndex, toIndex - 1).map(createPeriodFeature)
        )
            .map(filterAllMissing)
            .filter(ee.Filter.eq('_hasValidData', 1));

        const dates = periodFeatures.aggregate_array('date');
        const values = periodFeatures.aggregate_array('values');
        const counts = periodFeatures.aggregate_array('count');

        const raw = await geeGetInfo<{ dates: string[]; values: Array<Array<number | null>>; counts: number[] }>(
            ee.Dictionary({ dates, values, counts }),
        );

        const payload = {
            dates: Array.isArray(raw?.dates) ? raw.dates : [],
            values: Array.isArray(raw?.values) ? raw.values : [],
            counts: Array.isArray(raw?.counts) ? raw.counts : [],
        };

        const points: TimeSeriesPoint[] = [];

        for (let i = 0; i < payload.dates.length; i++) {
            const date = payload.dates[i];
            const vals = payload.values[i];
            const count = payload.counts[i];

            if (!date || !Array.isArray(vals) || vals.length !== indexes.length) {
                continue;
            }

            // Convert -9999 placeholder to null, and validate other values
            const parsed = vals.map((v) => {
                if (v === null || v === undefined) return null;
                const n = Number(v);
                if (n === -9999 || isNaN(n)) return null;
                return n;
            });

            points.push({
                date,
                values: parsed,
                count: Number(count) || 0,
            });
        }

        return points;
    }

    /**
     * Per-period summary used to drive the timeline data heatmap: for each period
     * (default month) it returns the mean NDVI over the AOI, the mean scene cloud
     * cover and the image count. Cached in Redis.
     *
     * Cloud metric: mean of CLOUDY_PIXEL_PERCENTAGE across the scenes intersecting
     * the AOI in the period — the SAME granule property the cloud-cover filter uses,
     * so the heatmap and the "≤ X%" filter speak the same language. No cloud filter
     * is applied here on purpose: the goal is to SHOW the real cloudiness so the
     * analyst can pick a clear month.
     *
     * NDVI is computed on a QA60 cloud-masked median composite of the period.
     * Periods with no images are omitted (the frontend renders them as "no data").
     * @param params - geometry is required as GeoJSON.Geometry
     * @param params.scale - Scale in meters for NDVI reduction (default: 10)
     * @param params.temporalResolution - Aggregation step (default: 'month')
     * @returns Summary array sorted by date (period start)
     */
    async getTimelineSummary(
        params: {
            startDate: string;
            endDate: string;
            geometry: Geometry;
            scale?: number;
            temporalResolution?: TemporalResolution;
        },
    ): Promise<TimelineSummaryPoint[]> {
        if (!this.geeService.isReady()) {
            throw new Error('GEE is not initialized. Please wait for initialization to complete.');
        }

        const unit: TemporalResolution = params.temporalResolution || 'month';
        const scale = params.scale || 10;

        const key = REDIS_KEYS.gee.sentinelTimelineSummary(
            this.cacheKey({
                kind: 'timeline-summary',
                startDate: params.startDate,
                endDate: params.endDate,
                geometry: params.geometry,
                scale,
                temporalResolution: unit,
            }),
        );

        const cached = await this.redis.get<TimelineSummaryPoint[]>(key);
        if (cached !== undefined) {
            return cached;
        }

        const result = await this.computeTimelineSummary({ ...params, unit, scale });

        // Only cache non-empty results; an empty range may be a transient GEE hiccup.
        if (result.length > 0) {
            await this.redis.set(key, result, REDIS_TTL.GEE_TIMELINE_SUMMARY);
        }

        return result;
    }

    private async computeTimelineSummary(params: {
        startDate: string;
        endDate: string;
        geometry: Geometry;
        unit: TemporalResolution;
        scale: number;
    }): Promise<TimelineSummaryPoint[]> {
        const { startDate, endDate, unit, scale } = params;

        this.logger.log(`Calculating ${unit} timeline summary (NDVI + cloud) from ${startDate} to ${endDate}`);

        const aoi = this.geojsonGeometryToEeGeometry(params.geometry);

        // Raw collection (no cloud filter): keeps CLOUDY_PIXEL_PERCENTAGE so the
        // per-period cloud mean reflects true cloudiness.
        const s2Raw = ee.ImageCollection(GeeImageCollection.S2SrHarmonized)
            .filterBounds(aoi)
            .filterDate(startDate, endDate);

        // QA60 cloud-masked NDVI band, used for the per-period NDVI median.
        const s2Ndvi = s2Raw
            .map((img: ee.Image) => this.maskS2QA60(img))
            .map((img: ee.Image) =>
                img.normalizedDifference([S2SrHarmonizedBand.NIR, S2SrHarmonizedBand.Red]).rename('NDVI'),
            );

        const start = ee.Date(startDate);
        const end = ee.Date(endDate);

        const nPeriods = await geeGetInfo<number>(
            end.difference(start, unit).ceil().toInt(),
        );

        if (!nPeriods || nPeriods <= 0) {
            this.logger.log('No periods in the requested range');
            return [];
        }

        const ranges = this.splitPeriodRange(nPeriods);

        this.logger.log(
            `Timeline summary spans ${nPeriods} ${unit} period(s) → ${ranges.length} GEE request(s) ` +
            `(concurrency ${TS_CONCURRENCY})`,
        );

        const chunkResults = await lastValueFrom(
            from(ranges).pipe(
                mergeMap(
                    ([fromIndex, toIndex]) =>
                        this.extractSummaryRange({ s2Raw, s2Ndvi, aoi, scale, unit, start, fromIndex, toIndex }),
                    TS_CONCURRENCY,
                ),
                toArray(),
            ),
        );

        const summary = chunkResults
            .flat()
            .sort((a, b) => a.date.localeCompare(b.date));

        this.logger.log(`Calculated timeline summary with ${summary.length} points`);

        return summary;
    }

    /**
     * Compute the timeline summary for a contiguous range of GLOBAL period indices
     * [fromIndex, toIndex). Mirrors extractPeriodRange: one getInfo per chunk, with
     * -9999 placeholders converted to null on the JS side. Periods with no images
     * (count == 0) are dropped server-side.
     */
    private async extractSummaryRange(opts: {
        s2Raw: ee.ImageCollection;
        s2Ndvi: ee.ImageCollection;
        aoi: ee.Geometry;
        scale: number;
        unit: TemporalResolution;
        start: ee.Date;
        fromIndex: number;
        toIndex: number;
    }): Promise<TimelineSummaryPoint[]> {
        const { s2Raw, s2Ndvi, aoi, scale, unit, start, fromIndex, toIndex } = opts;
        const meanReducer = ee.Reducer.mean();

        const createPeriodFeature = (i: ee.Number): ee.Feature => {
            const periodStart = start.advance(i, unit);
            const periodEnd = periodStart.advance(1, unit);

            const rawCol = s2Raw.filterDate(periodStart, periodEnd);
            const count = rawCol.size();

            // Mean scene cloud cover — same granule property as the cloud filter.
            const cloudRaw = ee.Algorithms.If(
                count.gt(0),
                rawCol.aggregate_mean(S2SrHarmonizedImageProperty.CloudyPixelPercentage),
                -9999,
            );
            const cloud = ee.Algorithms.If(ee.Algorithms.IsEqual(cloudRaw, null), -9999, cloudRaw);

            // Mean NDVI over the AOI from the QA60-masked period median.
            const ndvi = ee.Algorithms.If(
                count.gt(0),
                (function () {
                    const dayImg = s2Ndvi.filterDate(periodStart, periodEnd).median();
                    const stats = ee.Dictionary(
                        dayImg.reduceRegion({
                            reducer: meanReducer,
                            geometry: aoi,
                            scale: scale,
                            bestEffort: true,
                            maxPixels: 1e13,
                        }),
                    );
                    const rawVal = stats.get('NDVI');
                    return ee.Algorithms.If(ee.Algorithms.IsEqual(rawVal, null), -9999, rawVal);
                })(),
                -9999,
            );

            return ee.Feature(null, {
                date: periodStart.format('YYYY-MM-dd'),
                ndvi: ndvi,
                cloud: cloud,
                count: count,
            }).set('system:time_start', periodStart.millis());
        };

        // Keep only periods that actually have imagery.
        const periodFeatures = ee.FeatureCollection(
            ee.List.sequence(fromIndex, toIndex - 1).map(createPeriodFeature),
        ).filter(ee.Filter.gt('count', 0));

        const dates = periodFeatures.aggregate_array('date');
        const ndvis = periodFeatures.aggregate_array('ndvi');
        const clouds = periodFeatures.aggregate_array('cloud');
        const counts = periodFeatures.aggregate_array('count');

        const raw = await geeGetInfo<{
            dates: string[];
            ndvis: Array<number | null>;
            clouds: Array<number | null>;
            counts: number[];
        }>(ee.Dictionary({ dates, ndvis, clouds, counts }));

        const payload = {
            dates: Array.isArray(raw?.dates) ? raw.dates : [],
            ndvis: Array.isArray(raw?.ndvis) ? raw.ndvis : [],
            clouds: Array.isArray(raw?.clouds) ? raw.clouds : [],
            counts: Array.isArray(raw?.counts) ? raw.counts : [],
        };

        const toNumberOrNull = (v: number | null): number | null => {
            if (v === null || v === undefined) return null;
            const n = Number(v);
            if (n === -9999 || isNaN(n)) return null;
            return n;
        };

        const points: TimelineSummaryPoint[] = [];

        for (let i = 0; i < payload.dates.length; i++) {
            const date = payload.dates[i];
            if (!date) continue;

            points.push({
                date,
                ndvi: toNumberOrNull(payload.ndvis[i]),
                cloud: toNumberOrNull(payload.clouds[i]),
                count: Number(payload.counts[i]) || 0,
            });
        }

        return points;
    }
}
