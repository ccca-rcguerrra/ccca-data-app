import { queryOptions, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { AppConfigService } from '@/services/app-config/app-config.service';
import { useAuthStore } from '@/stores/auth-store';
import type { InitiativePublicMetadata } from '@/types/app-config';

export const appConfigQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.appConfig.get(),
    queryFn: () => AppConfigService.get(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const publicInitiativeMetadataQueryOptions = () =>
  queryOptions<InitiativePublicMetadata>({
    queryKey: QUERY_KEYS.appConfig.publicMetadata(),
    queryFn: () => AppConfigService.getPublicMetadata(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

export const usePublicInitiativeMetadata = () =>
  useQuery(publicInitiativeMetadataQueryOptions());

export const useAppConfig = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    ...appConfigQueryOptions(),
    enabled: isAuthenticated,
  });
};

export const useFeatures = () => ({} as Record<string, boolean>);

export const useTerritoryFilters = () => ({
  teamFilters: [] as string[],
});
