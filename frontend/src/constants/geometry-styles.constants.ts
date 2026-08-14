import type { GeoJSONLayerProps } from '@/components/map/types';

/**
 * Canonical MapLibre GeoJSONLayer paints for alert geometries (legacy Angular `GeometryStyles`).
 * Use across the app for any map overlay of these semantic types.
 */
export const geometryLayerStyles = {
  /** Alert.default — base / selected alert footprint */
  alertBase: {
    fillColor: '#e0e63b',
    lineColor: '#e0e63b',
    fillOpacity: 0.05,
    lineWidth: 2,
  } satisfies GeoJSONLayerProps['style'],

  /** Alert.refined — manually or automatically refined polygon (optional dedicated layer) */
  alertRefined: {
    fillColor: '#ff0000',
    lineColor: '#ff0000',
    fillOpacity: 0.1,
    lineWidth: 2,
  } satisfies GeoJSONLayerProps['style'],

  /** RefinementSamples.boundery */
  bounds: {
    fillColor: '#cccccc',
    lineColor: '#cccccc',
    fillOpacity: 0,
    lineWidth: 2,
  } satisfies GeoJSONLayerProps['style'],

  /** RefinementSamples.deforestation */
  deforestation: {
    fillColor: '#f3ae01',
    lineColor: '#f3ae01',
    fillOpacity: 0.2,
    lineWidth: 2,
  } satisfies GeoJSONLayerProps['style'],

  /** RefinementSamples.notDeforestation */
  notDeforestation: {
    fillColor: '#168800',
    lineColor: '#168800',
    fillOpacity: 0.2,
    lineWidth: 2,
  } satisfies GeoJSONLayerProps['style'],

  /** Neighboring alerts */
  neighboringAlerts: {
    fillColor: '#ff8128',
    lineColor: '#ff8128',
    fillOpacity: 0,
    lineWidth: 2,
  } satisfies GeoJSONLayerProps['style'],

  /** Activation geometry */
  activation: {
    fillColor: '#00a3ff',
    lineColor: '#00a3ff',
    fillOpacity: 0,
    lineWidth: 2,
    lineDasharray: [2, 2],
  } satisfies GeoJSONLayerProps['style'],

  /** Activation geometry minimum required extent (500 m guide) */
  activationGuide: {
    fillColor: '#9CA3AF',
    lineColor: '#6B7280',
    lineOpacity: 0.3,
    fillOpacity: 0,
    lineWidth: 1.5,
    lineDasharray: [6, 4],
  } satisfies GeoJSONLayerProps['style'],
} as const;

/**
 * Tailwind classes for refinement toolbar icons — same palette as {@link geometryLayerStyles},
 * with dark-mode variants for contrast on `bg-background`.
 */
export const geometryToolIconClassName = {
  bounds: 'text-[#cccccc] dark:text-neutral-200',
  deforestation: 'text-[#f3ae01] dark:text-[#f5bd3a]',
  notDeforestation: 'text-[#168800] dark:text-[#5ee987]',
  activation: 'text-[#00a3ff] dark:text-[#56c4ff]',
  /** Matches alert footprint / manual geometry (Alert.default) */
  alertBase: 'text-[#e0e63b] dark:text-[#eef06a]',
  /** Refined polygon emphasis (Alert.refined) */
  alertRefined: 'text-[#ff0000]/50 dark:text-[#ff6b6b]/50',
  neighboringAlerts: 'text-[#ff8128] dark:text-[#ffa366]',
} as const;
