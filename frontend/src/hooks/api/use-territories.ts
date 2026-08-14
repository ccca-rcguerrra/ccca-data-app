import { queryOptions, useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { TerritoriesListParams, TerritoryBbox } from '@/types/territories';
import { TerritoriesService } from '@/services/territories/territories.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

export const territoriesListQueryOptions = (
  params: TerritoriesListParams = {}
) =>
  queryOptions({
    queryKey: QUERY_KEYS.territories.list(params),
    queryFn: () => TerritoriesService.findAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

export const territoryDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.territories.detail(id),
    queryFn: () => TerritoriesService.findOne(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

export const territoryBboxQueryOptions = (id: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.territories.bbox(id),
    queryFn: () => TerritoriesService.findOne(id, true),
    staleTime: 1000 * 60 * 10, // 10 minutes — bbox is stable
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

/**
 * Hook to fetch paginated territories
 */
export const useTerritoriesQuery = (
  params: TerritoriesListParams = {},
  options?: { enabled?: boolean }
) => {
  return useQuery({
    ...territoriesListQueryOptions(params),
    enabled: options?.enabled !== false,
  });
};

/**
 * Hook to fetch a single territory by ID
 */
export const useTerritoryQuery = (id: number, enabled = true) => {
  return useQuery({
    ...territoryDetailQueryOptions(id),
    enabled: enabled && !!id,
  });
};

/** Combine several bounding boxes into their union, or null when empty. */
const unionBbox = (boxes: TerritoryBbox[]): TerritoryBbox | null => {
  if (boxes.length === 0) return null;
  let [w, s, e, n] = boxes[0];
  for (let i = 1; i < boxes.length; i++) {
    const [bw, bs, be, bn] = boxes[i];
    w = Math.min(w, bw);
    s = Math.min(s, bs);
    e = Math.max(e, be);
    n = Math.max(n, bn);
  }
  return [w, s, e, n];
};

/**
 * Fetch the bounding box of each territory id and return their union.
 * Used to fit the map to the currently selected territory filter.
 */
export const useTerritoriesBbox = (ids: number[]) => {
  const results = useQueries({
    queries: ids.map((id) => territoryBboxQueryOptions(id)),
  });

  const isLoading = results.some((r) => r.isLoading);

  const bbox = useMemo(() => {
    const boxes = results
      .map((r) => r.data?.bbox)
      .filter((b): b is TerritoryBbox => Array.isArray(b) && b.length === 4);
    return unionBbox(boxes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.data?.bbox?.join(',') ?? '').join('|')]);

  return { bbox, isLoading };
};
