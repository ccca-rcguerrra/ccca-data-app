import type * as GeoJSON from 'geojson';
import { area as turfArea, flatten, simplify, buffer, combine, featureCollection } from '@turf/turf';
import * as turf from '@turf/turf';

/**
 * Type guard: checks if a value is a GeoJSON Feature.
 */
function isFeature(input: unknown): input is GeoJSON.Feature<GeoJSON.Geometry> {
    return !!input && typeof input === 'object' && (input as any).type === 'Feature';
}

/**
 * Type guard: checks if a value is a GeoJSON FeatureCollection.
 */
function isFeatureCollection(input: unknown): input is GeoJSON.FeatureCollection<GeoJSON.Geometry> {
    return !!input && typeof input === 'object' && (input as any).type === 'FeatureCollection';
}

/**
 * Wraps a GeoJSON Geometry into a Feature (if needed).
 */
function toFeature<G extends GeoJSON.Geometry>(
    geom: G,
    properties: GeoJSON.GeoJsonProperties = {}
): GeoJSON.Feature<G> {
    return {
        type: 'Feature',
        geometry: geom,
        properties,
    };
}

/**
 * Normalizes input into a Feature or FeatureCollection (for Turf consumption).
 */
function toFeatureInput(
    input:
        | GeoJSON.Geometry
        | GeoJSON.Feature<GeoJSON.Geometry>
        | GeoJSON.FeatureCollection<GeoJSON.Geometry>
): GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> {
    if (isFeatureCollection(input)) {
        return input;
    }
    if (isFeature(input)) {
        return input;
    }
    return toFeature(input);
}

/**
 * Converts a MultiPolygon (or Feature/FeatureCollection of MultiPolygon) to a FeatureCollection of Polygon using turf.js.
 *
 * Accepts:
 * - MultiPolygon (Geometry)
 * - Feature<MultiPolygon>
 * - FeatureCollection<MultiPolygon>
 *
 * Returns:
 * - FeatureCollection<Polygon>
 */
export function multiPolygonToFeatureCollection(
    input:
        | GeoJSON.MultiPolygon
        | GeoJSON.Feature<GeoJSON.MultiPolygon>
        | GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
    if (!input) {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }

    const featureInput = toFeatureInput(
        (input as any).type === 'MultiPolygon'
            ? (input as GeoJSON.MultiPolygon)
            : (input as GeoJSON.Feature<GeoJSON.MultiPolygon> | GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>)
    );

    const flattened = flatten(featureInput as any) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

    const polygons: GeoJSON.Feature<GeoJSON.Polygon>[] = (flattened.features || [])
        .filter((f): f is GeoJSON.Feature<GeoJSON.Polygon> => {
            const geom = f?.geometry as GeoJSON.Geometry | undefined;
            return geom?.type === 'Polygon';
        });

    return {
        type: 'FeatureCollection',
        features: polygons,
    };
}

/**
 * Merges polygon/multipolygon features into one geometry (turf.combine) for intersection and difference.
 */
export function combinePolygonFeatureCollection(
    fc: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null | undefined
): GeoJSON.Geometry | null {
    if (!fc?.features?.length) return null;
    const polygonal = fc.features.filter((f): f is GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> => {
        const g = f.geometry;
        return g?.type === 'Polygon' || g?.type === 'MultiPolygon';
    });
    if (polygonal.length === 0) return null;
    if (polygonal.length === 1) return polygonal[0].geometry ?? null;
    try {
        const merged = combine(featureCollection(polygonal));
        return merged.features[0]?.geometry ?? polygonal[0].geometry ?? null;
    } catch {
        return polygonal[0].geometry ?? null;
    }
}

/**
 * Simplifies a FeatureCollection using Turf.js simplify function.
 * Applies simplification to each feature in the collection.
 *
 * @param featureCollection - The FeatureCollection to simplify
 * @param tolerance - Simplification tolerance (higher = more simplification)
 * @param highQuality - Whether to use high quality simplification (slower but more accurate)
 * @returns Simplified FeatureCollection (or original if it fails)
 */
export function simplifyGeom(
    featureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null,
    tolerance: number,
    highQuality: boolean = true
): GeoJSON.FeatureCollection<GeoJSON.Geometry> | null {
    if (!featureCollection || !featureCollection.features || featureCollection.features.length === 0) {
        return featureCollection;
    }

    if (tolerance <= 0) {
        return featureCollection;
    }

    try {
        const simplifiedFeatures = featureCollection.features.map((feature) => {
            const simplified = simplify(feature as any, {
                tolerance,
                highQuality,
            }) as GeoJSON.Feature<GeoJSON.Geometry>;

            return {
                ...simplified,
                properties: feature.properties || {},
                id: feature.id,
            };
        });

        return {
            type: 'FeatureCollection',
            features: simplifiedFeatures,
        };
    } catch (error) {
        console.error('Error simplifying feature collection:', error);
        return featureCollection;
    }
}

interface CleaningOptions {
    toleranceOut: number;
    toleranceIn?: number;
}

/**
 * cleaningGeom — removes insignificant polygons (small exteriors) and small
 * holes based on an area tolerance relative to the largest exterior.
 *
 * Algorithm:
 *   1. Flatten MultiPolygon into individual Polygons.
 *   2. For each Polygon, split into exterior ring (index 0) and holes (index 1+);
 *      degenerate rings (< 4 points) are discarded.
 *   3. Compute the area of each exterior ring.
 *   4. maxExteriorArea = largest area among the exteriors (global reference).
 *   5. Discard exteriors whose exteriorArea/maxExteriorArea < toleranceOut; their
 *      holes are discarded together.
 *   6. For each surviving exterior, keep only holes where
 *      holeArea/maxExteriorArea >= toleranceOut.
 *   7. Reassemble survivors into a single MultiPolygon Feature.
 *
 * Notes:
 *   - toleranceIn is ignored (kept only for API compatibility).
 *   - Holes are never promoted to standalone polygons.
 *   - Both filters use the same global reference (maxExteriorArea) and the
 *     same threshold (toleranceOut).
 */
export function cleaningGeom(
    fc: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null,
    options: Pick<CleaningOptions, 'toleranceOut'>
): GeoJSON.FeatureCollection<GeoJSON.Geometry> | null {
    if (!fc?.features?.length) return fc;

    const { toleranceOut } = options;
    if (toleranceOut <= 0) return fc;

    const emptyResult: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
        type: 'FeatureCollection',
        features: [],
    };

    // 1. Flatten MultiPolygon into individual Polygons
    const polygons: GeoJSON.Polygon[] = [];

    for (const feat of fc.features) {
        if (!feat?.geometry) continue;
        const g = feat.geometry;

        if (g.type === 'Polygon') {
            polygons.push(g);
        } else if (g.type === 'MultiPolygon') {
            for (const coords of g.coordinates) {
                polygons.push({ type: 'Polygon', coordinates: coords });
            }
        }
    }

    if (polygons.length === 0) return emptyResult;

    // 2. Split each polygon into exterior + holes, discarding degenerate rings
    type PolygonParts = { exterior: GeoJSON.Position[]; holes: GeoJSON.Position[][] };
    const parts: PolygonParts[] = [];

    for (const poly of polygons) {
        const [exterior, ...holes] = poly.coordinates;
        if (!exterior || exterior.length < 4) continue;

        const validHoles = holes.filter((h) => Array.isArray(h) && h.length >= 4);
        parts.push({ exterior, holes: validHoles });
    }

    if (parts.length === 0) return emptyResult;

    // 3. Compute area of each exterior ring (safely)
    const exteriorAreas = parts.map((p) => {
        try {
            return turfArea({ type: 'Polygon', coordinates: [p.exterior] });
        } catch {
            return 0;
        }
    });

    // 4. Largest exterior area — global reference for both filters
    const maxExteriorArea = exteriorAreas.reduce((acc, v) => (v > acc ? v : acc), 0);
    if (maxExteriorArea <= 0) return emptyResult;

    // 5 & 6. Filter exteriors by area; for survivors, filter their holes by area
    const kept: GeoJSON.Position[][][] = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const exteriorArea = exteriorAreas[i] ?? 0;
        if (!part || exteriorArea <= 0) continue;

        if ((exteriorArea / maxExteriorArea) < toleranceOut) continue;

        const survivingHoles = part.holes.filter((hole) => {
            let holeArea = 0;
            try {
                holeArea = turfArea({ type: 'Polygon', coordinates: [hole] });
            } catch {
                return false;
            }
            return holeArea > 0 && (holeArea / maxExteriorArea) >= toleranceOut;
        });

        kept.push([part.exterior, ...survivingHoles]);
    }

    if (kept.length === 0) return emptyResult;

    // 7. Return individual Polygon features (holes preserved per feature).
    // A single MultiPolygon feature would make MapboxDraw treat all rings as
    // one entity — deleting any ring removes them all.
    return {
        type: 'FeatureCollection',
        features: kept.map((coords) => ({
            type: 'Feature' as const,
            geometry: { type: 'Polygon' as const, coordinates: coords },
            properties: {},
        })),
    };
}

interface SmoothOptions {
    /** Number of Chaikin iterations (1–10, default 3). More iterations = smoother, more vertices. */
    iterations?: number;
}

/**
 * smoothGeom — suaviza os cantos de polígonos usando o Algoritmo de Chaikin.
 *
 * Algoritmo de Chaikin (corner cutting):
 *   Para cada aresta (P0 → P1), dois novos pontos substituem a aresta:
 *     Q = ¾·P0 + ¼·P1   (ponto a 25% do fim)
 *     R = ¼·P0 + ¾·P1   (ponto a 75% do fim)
 *   Cada iteração dobra o número de vértices e "corta" os cantos angulosos.
 *
 * Notas:
 *   - Preserva topologia: o resultado é sempre um polígono fechado válido.
 *   - Aplicado sobre todos os rings (exterior + buracos) de cada Polygon.
 *   - MultiPolygons são processados face a face.
 *   - Não altera features não-poligonais.
 *   - iterations padrão: 3 (~8× mais vértices que o original por iteração dobrada).
 */
export function smoothGeom(
    fc: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null,
    options: SmoothOptions = {}
): GeoJSON.FeatureCollection<GeoJSON.Geometry> | null {
    if (!fc?.features?.length) return fc;

    const iterations = Math.max(1, Math.min(10, options.iterations ?? 3));

    // ── Chaikin sobre um ring (array de posições fechado) ─────────────────────
    // O ring de entrada deve estar fechado (primeiro == último ponto).
    // Retorna um ring fechado com ~2× os vértices por iteração.
    function chaikinRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
        // Trabalha sobre os segmentos sem o ponto de fechamento duplicado
        const pts = ring.slice(0, -1);
        const n = pts.length;
        if (n < 3) return ring; // ring degenerado, retorna original

        const out: GeoJSON.Position[] = [];

        for (let i = 0; i < n; i++) {
            const p0 = pts[i];
            const p1 = pts[(i + 1) % n];

            // Q = ¾·P0 + ¼·P1
            out.push([
                0.75 * p0[0] + 0.25 * p1[0],
                0.75 * p0[1] + 0.25 * p1[1],
            ]);
            // R = ¼·P0 + ¾·P1
            out.push([
                0.25 * p0[0] + 0.75 * p1[0],
                0.25 * p0[1] + 0.75 * p1[1],
            ]);
        }

        // Fecha o ring (primeiro ponto repetido no final)
        out.push(out[0]);
        return out;
    }

    function smoothRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
        let result = ring;
        for (let i = 0; i < iterations; i++) {
            result = chaikinRing(result);
        }
        return result;
    }

    function smoothPolygon(poly: GeoJSON.Polygon): GeoJSON.Polygon {
        return {
            type: 'Polygon',
            coordinates: poly.coordinates.map(smoothRing),
        };
    }

    function smoothGeometry(geom: GeoJSON.Geometry): GeoJSON.Geometry {
        if (geom.type === 'Polygon') {
            return smoothPolygon(geom);
        }
        if (geom.type === 'MultiPolygon') {
            return {
                type: 'MultiPolygon',
                coordinates: geom.coordinates.map((face) =>
                    smoothPolygon({ type: 'Polygon', coordinates: face }).coordinates
                ),
            };
        }
        return geom; // Point, LineString, etc. — retorna sem alteração
    }

    return {
        type: 'FeatureCollection',
        features: fc.features.map((feat) => {
            if (!feat?.geometry) return feat;
            return { ...feat, geometry: smoothGeometry(feat.geometry) };
        }),
    };
}

/** Parameters for {@link applyAlertRefinementPipeline} (simplification, cleaning tolerance, Chaikin iterations). */
export interface AlertRefinementPipelineParams {
    simplification: number;
    cleaning: number;
    smooth: number;
}

/**
 * Runs cleaning → simplification → smoothing in order on a FeatureCollection.
 * Used when processing parameters change; not tied to geometry identity changes.
 */
export function applyAlertRefinementPipeline(
    original: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null,
    params: AlertRefinementPipelineParams
): GeoJSON.FeatureCollection<GeoJSON.Geometry> | null {
    if (!original?.features?.length) {
        return original;
    }

    const simplificationNum =
        typeof params.simplification === 'number' &&
        Number.isFinite(params.simplification) &&
        !Number.isNaN(params.simplification)
            ? params.simplification
            : 0;

    const cleaningTolerance =
        typeof params.cleaning === 'number' && Number.isFinite(params.cleaning) && !Number.isNaN(params.cleaning)
            ? Math.max(0, params.cleaning)
            : 0;

    const smoothIterations =
        typeof params.smooth === 'number' && Number.isFinite(params.smooth) && !Number.isNaN(params.smooth)
            ? Math.max(0, Math.round(params.smooth))
            : 0;

    let processed: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null = original;

    if (cleaningTolerance > 0) {
        const cleaned = cleaningGeom(processed, { toleranceOut: cleaningTolerance });
        if (cleaned) {
            processed = cleaned;
        }
    }

    if (simplificationNum > 0) {
        const simplified = simplifyGeom(processed, simplificationNum, false);
        if (simplified) {
            processed = simplified;
        }
    }

    if (smoothIterations > 0) {
        const smoothed = smoothGeom(processed, { iterations: smoothIterations });
        if (smoothed) {
            processed = smoothed;
        }
    }

    return processed;
}

interface BufferOptions {
    distance: number;
    units?: 'kilometers' | 'meters' | 'miles' | 'feet' | 'degrees';
    steps?: number;
}

/**
 * Applies buffer to a FeatureCollection using Turf.js buffer function.
 * Applies buffer to each feature in the collection.
 *
 * @param featureCollection - The FeatureCollection to buffer
 * @param options - Buffer options (distance, units, steps)
 * @returns Buffered FeatureCollection (or original if it fails)
 */
export function bufferGeom(
    featureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null,
    options: BufferOptions
): GeoJSON.FeatureCollection<GeoJSON.Geometry> | null {
    if (!featureCollection || !featureCollection.features || featureCollection.features.length === 0) {
        return featureCollection;
    }

    const {
        distance,
        units = 'meters',
        steps = 64,
    } = options;

    if (distance === 0) {
        return featureCollection;
    }

    try {
        const bufferedFeatures = featureCollection.features.map((feature) => {
            try {
                const buffered = buffer(feature as any, distance, {
                    units,
                    steps,
                }) as GeoJSON.Feature<GeoJSON.Geometry>;

                return {
                    ...buffered,
                    properties: feature.properties || {},
                    id: feature.id,
                };
            } catch (error) {
                console.warn('Error buffering feature:', error);
                // Return original feature if buffering fails
                return feature;
            }
        });

        return {
            type: 'FeatureCollection',
            features: bufferedFeatures,
        };
    } catch (error) {
        console.error('Error buffering feature collection:', error);
        return featureCollection;
    }
}

/**
 * Generate a square polygon with a buffer
 * @param geometry - The geometry to buffer (Geometry or Feature)
 * @param radius - Buffer radius in kilometers
 * @returns Buffered geometry as a Polygon (geometry only, not a Feature)
 */
export function squareBuffer(
    geometry: GeoJSON.Geometry | GeoJSON.Feature<GeoJSON.Geometry>,
    radius: number
): GeoJSON.Polygon {
    // Convert to Geometry if it's a Feature
    const geom: GeoJSON.Geometry = isFeature(geometry) ? geometry.geometry : geometry;

    const envelopeFeature = turf.envelope(geom);

    const northSidePoint0 = turf.point(envelopeFeature.geometry.coordinates[0][0]);
    const northSidePoint1 = turf.point(envelopeFeature.geometry.coordinates[0][1]);

    const eastSidePoint0 = turf.point(envelopeFeature.geometry.coordinates[0][1]);
    const eastSidePoint1 = turf.point(envelopeFeature.geometry.coordinates[0][2]);

    const northDistance = turf.distance(northSidePoint0, northSidePoint1);
    const eastDistance = turf.distance(eastSidePoint0, eastSidePoint1);

    const maxDistance = Math.max(northDistance, eastDistance);

    let centroidBuffer = radius + (maxDistance / 2);

    const squareBufferFeature = turf.envelope(turf.buffer(turf.centroid(envelopeFeature.geometry), centroidBuffer));

    return squareBufferFeature.geometry;
}

export interface GeometryCentroid {
    lat: number;
    lng: number;
}

/**
 * Computes the centroid of a GeoJSON geometry (lat/lng from geometry/first footprint).
 */
export function getGeometryCentroid(
    geometry: GeoJSON.Geometry | null | undefined
): GeometryCentroid | null {
    if (!geometry) return null;

    try {
        const centroid = turf.centroid(geometry);
        const [lng, lat] = centroid.geometry.coordinates;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    } catch {
        return null;
    }
}

/**
 * Formats centroid coordinates for display and clipboard (lat, lng).
 */
export function formatGeometryCentroid(centroid: GeometryCentroid, precision = 6): string {
    return `${centroid.lat.toFixed(precision)}, ${centroid.lng.toFixed(precision)}`;
}

/** Google Maps search URL for the coordinates shown in the UI (official Maps URLs API). */
export function buildGoogleMapsCentroidUrl(centroidLabel: string): string | null {
    const parts = centroidLabel.split(',').map((part) => part.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const query = `${parts[0]},${parts[1]}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
