import { useQuery, useMutation } from '@tanstack/react-query';
import { GeeService } from '@/services/gee/gee.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import type {
  SentinelImagesParams,
  SentinelPngParams,
  SentinelIndexesTimeSeriesParams,
  SentinelTimelineSummaryParams,
} from '@/types/gee';

/**
 * Hook to fetch GEE status
 */
export const useGeeStatusQuery = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.gee.status(),
    queryFn: () => GeeService.getStatus(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch Sentinel-2 images as FeatureCollection
 */
export const useSentinelImagesFeaturesQuery = (
  params: SentinelImagesParams | null,
  enabled = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.gee.sentinelFeatures(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Parameters are required');
      }
      return GeeService.getSentinelImagesFeatures(params);
    },
    enabled: enabled && !!params,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // Don't retry expensive operations
  });
};

/**
 * Hook to fetch Sentinel-2 mosaic map layer
 */
export const useSentinelMosaicMapLayerQuery = (
  params: SentinelImagesParams | null,
  enabled = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.gee.sentinelMosaicMapLayer(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Parameters are required');
      }
      return GeeService.getSentinelMosaicMapLayer(params);
    },
    enabled: enabled && !!params,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // Don't retry expensive operations
  });
};

/**
 * Hook to fetch Sentinel-2 mosaic PNG image
 */
export const useSentinelMosaicPngQuery = (
  params: SentinelPngParams | null,
  enabled = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.gee.sentinelMosaicPng(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Parameters are required');
      }
      return GeeService.getSentinelMosaicPng(params);
    },
    enabled: enabled && !!params,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // Don't retry expensive operations
  });
};

/**
 * Mutation hook to get Sentinel-2 images as FeatureCollection
 * Useful when you want to trigger the request manually
 */
export const useGetSentinelImagesFeaturesMutation = () => {
  return useMutation({
    mutationFn: (params: SentinelImagesParams) =>
      GeeService.getSentinelImagesFeatures(params),
  });
};

/**
 * Mutation hook to get Sentinel-2 mosaic map layer
 * Useful when you want to trigger the request manually
 */
export const useGetSentinelMosaicMapLayerMutation = () => {
  return useMutation({
    mutationFn: (params: SentinelImagesParams) =>
      GeeService.getSentinelMosaicMapLayer(params),
  });
};

/**
 * Mutation hook to get Sentinel-2 mosaic PNG image
 * Useful when you want to trigger the request manually
 */
export const useGetSentinelMosaicPngMutation = () => {
  return useMutation({
    mutationFn: (params: SentinelPngParams) =>
      GeeService.getSentinelMosaicPng(params),
  });
};

/**
 * Hook to fetch Sentinel-2 spectral indexes time series
 * Returns daily time series of mean values for one or more spectral indexes (NDVI, NBR, NDMI)
 */
export const useSentinelIndexesTimeSeriesQuery = (
  params: SentinelIndexesTimeSeriesParams | null,
  enabled = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.gee.sentinelTimeSeries(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Parameters are required');
      }
      return GeeService.getSentinelIndexesTimeSeries(params);
    },
    enabled: enabled && !!params,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - timeseries data doesn't change
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in cache for a week
    retry: false, // Don't retry expensive operations
  });
};

/**
 * Mutation hook to get Sentinel-2 spectral indexes time series
 * Useful when you want to trigger the request manually
 */
export const useGetSentinelIndexesTimeSeriesMutation = () => {
  return useMutation({
    mutationFn: (params: SentinelIndexesTimeSeriesParams) =>
      GeeService.getSentinelIndexesTimeSeries(params),
  });
};

/**
 * Hook to fetch the Sentinel-2 timeline summary (per-period NDVI + mean cloud
 * cover + image count) that drives the data heatmap under the map timeline slider.
 * Pass `enabled = false` until the user opts into the data strip — this is an
 * expensive GEE operation, so keep it lazy like the mosaic layer.
 */
export const useSentinelTimelineSummaryQuery = (
  params: SentinelTimelineSummaryParams | null,
  enabled = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.gee.sentinelTimelineSummary(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Parameters are required');
      }
      return GeeService.getSentinelTimelineSummary(params);
    },
    enabled: enabled && !!params,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - summary data doesn't change
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in cache for a week
    retry: false, // Don't retry expensive operations
  });
};

/**
 * Mutation hook to get the Sentinel-2 timeline summary
 * Useful when you want to trigger the request manually
 */
export const useGetSentinelTimelineSummaryMutation = () => {
  return useMutation({
    mutationFn: (params: SentinelTimelineSummaryParams) =>
      GeeService.getSentinelTimelineSummary(params),
  });
};

/**
 * Main hook that provides all GEE-related queries and mutations
 * Maintains consistency with other hooks pattern
 */
export function useGee() {
  const statusQuery = useGeeStatusQuery();

  return {
    // Status
    status: statusQuery.data ?? null,
    isLoadingStatus: statusQuery.isLoading,
    isErrorStatus: statusQuery.isError,
    errorStatus: statusQuery.error,
    refetchStatus: statusQuery.refetch,

    // Mutations
    getSentinelImagesFeatures: useGetSentinelImagesFeaturesMutation(),
    getSentinelMosaicMapLayer: useGetSentinelMosaicMapLayerMutation(),
    getSentinelMosaicPng: useGetSentinelMosaicPngMutation(),
    getSentinelIndexesTimeSeries: useGetSentinelIndexesTimeSeriesMutation(),
    getSentinelTimelineSummary: useGetSentinelTimelineSummaryMutation(),
  };
}
