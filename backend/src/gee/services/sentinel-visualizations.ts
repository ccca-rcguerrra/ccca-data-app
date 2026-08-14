import ee = require('@google/earthengine');
import { S2SrHarmonizedBand } from '../types/collections';
import { SentinelVisualization } from '../types/sentinel-visualization.enum';

/**
 * Resolved visualization: the ee.Image to render plus the visParams to pass to
 * getMap()/getThumbURL(). For RGB composites the source mosaic is reused as-is
 * (band selection happens via visParams.bands); for index modes a derived
 * single-band image is returned with a palette.
 */
export interface ResolvedVisualization {
  image: ee.Image;
  visParams: Record<string, unknown>;
}

// ── True colour (default) — B4/B3/B2 ────────────────────────────────────────
const NATURAL_COLOR_VIS = {
  bands: [S2SrHarmonizedBand.Red, S2SrHarmonizedBand.Green, S2SrHarmonizedBand.Blue],
  gamma: [0.95, 1.1, 1],
  min: 0,
  max: 3000,
};

// ── False colour (colour infrared) — B8/B4/B3 ───────────────────────────────
// NIR/RED/GREEN composite — the Copernicus Browser "False color" layer: healthy
// vegetation appears bright red, water dark, bare soil/urban in cyan/grey.
// max 4000 ≈ Sentinel Hub HighlightCompressVisualizer(0, 0.4).
const FALSE_COLOR_VIS = {
  bands: [S2SrHarmonizedBand.NIR, S2SrHarmonizedBand.Red, S2SrHarmonizedBand.Green],
  min: 0,
  max: 4000,
};

// ── Short-wave infrared composite (SWIR) — B12/B8A/B4 ───────────────────────
// Copernicus Browser "SWIR" layer: vegetation in shades of green, soil/built-up
// in brown, water black, newly burned land bright. max 4000 ≈ Sentinel Hub gain 2.5.
const SWIR_VIS = {
  bands: [S2SrHarmonizedBand.SWIR2, S2SrHarmonizedBand.NIRNarrow, S2SrHarmonizedBand.Red],
  min: 0,
  max: 4000,
};

// ── NDMI palette (Copernicus "Moisture index": dry/red → wet/blue) ──────────
// Exact Sentinel Hub NDMI ramp (no green/orange): dark red (barren / water stress)
// → red → yellow → cyan → blue → dark blue (high canopy moisture).
const NDMI_PALETTE = [
  '800000', 'ff0000', 'ffff00', '00ffff', '0000ff', '000080',
];

// ── NDVI palette (Copernicus Browser / Sentinel Hub green ramp) ─────────────
// Pale (barren/low) → greens → dark green (dense vegetation), saturating at ~0.6.
const NDVI_PALETTE = [
  'fff9cc', 'ede8b5', 'ddd89b', 'ccc682', 'bcb76b', 'afc160', 'a3cc59',
  '91bf51', '7fb247', '70a33f', '609635', '4f892d', '3f7c23', '306d1c',
  '216011', '0f540a', '004400',
];

/**
 * Resolve a Sentinel-2 mosaic + visualization mode into the image and visParams
 * to render. Defaults to NaturalColor for unknown/missing modes.
 * @param mosaic - Pre-built Sentinel-2 mosaic (raw bands, not yet visualized)
 * @param visualization - Visualization mode
 */
export function resolveSentinelVisualization(
  mosaic: ee.Image,
  visualization?: SentinelVisualization | null,
): ResolvedVisualization {
  switch (visualization) {
    case SentinelVisualization.FalseColor:
      return { image: mosaic, visParams: FALSE_COLOR_VIS };

    case SentinelVisualization.SWIR:
      return { image: mosaic, visParams: SWIR_VIS };

    case SentinelVisualization.NDMI:
      return {
        image: mosaic.normalizedDifference([S2SrHarmonizedBand.NIRNarrow, S2SrHarmonizedBand.SWIR1]).rename('NDMI'),
        visParams: { min: -0.4, max: 0.4, palette: NDMI_PALETTE },
      };

    case SentinelVisualization.NDVI:
      return {
        image: mosaic.normalizedDifference([S2SrHarmonizedBand.NIR, S2SrHarmonizedBand.Red]).rename('NDVI'),
        visParams: { min: 0, max: 1.0, palette: NDVI_PALETTE },
      };

    case SentinelVisualization.NaturalColor:
    default:
      return { image: mosaic, visParams: NATURAL_COLOR_VIS };
  }
}
