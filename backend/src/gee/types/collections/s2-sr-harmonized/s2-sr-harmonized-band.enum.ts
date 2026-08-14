/** Band identifiers for COPERNICUS/S2_SR_HARMONIZED — use in .select() and GEE filter calls. */
export enum S2SrHarmonizedBand {
  // ── 10 m spectral ─────────────────────────────────────────────────────────
  Blue             = 'B2',
  Green            = 'B3',
  Red              = 'B4',
  NIR              = 'B8',
  // ── 20 m spectral ─────────────────────────────────────────────────────────
  RedEdge1         = 'B5',
  RedEdge2         = 'B6',
  RedEdge3         = 'B7',
  NIRNarrow        = 'B8A',
  SWIR1            = 'B11',
  SWIR2            = 'B12',
  // ── 60 m spectral ─────────────────────────────────────────────────────────
  CoastalAerosol   = 'B1',
  WaterVapour      = 'B9',
  // ── Derived / auxiliary (10 m resampled) ──────────────────────────────────
  AOT              = 'AOT',
  WVP              = 'WVP',
  // ── True Colour Image (pre-rendered, 10 m, int [0–255]) ───────────────────
  TCI_R            = 'TCI_R',
  TCI_G            = 'TCI_G',
  TCI_B            = 'TCI_B',
  // ── Scene Classification Layer (20 m, int [0–255], classes 0–11) ──────────
  SCL              = 'SCL',
  // ── Cloud / snow probability (20 m, int [0–255], semantic 0–100 %) ────────
  MSK_CLDPRB       = 'MSK_CLDPRB',
  MSK_SNWPRB       = 'MSK_SNWPRB',
  // ── Classification masks (10 m, int [0–255]) ──────────────────────────────
  MSK_CLASSI_OPAQUE   = 'MSK_CLASSI_OPAQUE',
  MSK_CLASSI_CIRRUS   = 'MSK_CLASSI_CIRRUS',
  MSK_CLASSI_SNOW_ICE = 'MSK_CLASSI_SNOW_ICE',
  // ── QA bit masks ──────────────────────────────────────────────────────────
  QA10             = 'QA10',
  QA20             = 'QA20',
  QA60             = 'QA60',
}
