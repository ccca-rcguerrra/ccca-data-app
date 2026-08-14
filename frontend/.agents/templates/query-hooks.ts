import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DomainService } from '@/services/domain/domain.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import type { DomainItem, DomainListParams, CreateDomainDto, UpdateDomainDto } from '@/types/domain';

export const domainListQueryOptions = (params?: DomainListParams) =>
  queryOptions({
    queryKey: QUERY_KEYS.domain.list(params),
    queryFn: () => DomainService.findAll(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

export function useDomainListQuery(params?: DomainListParams) {
  return useQuery(domainListQueryOptions(params));
}

export const domainDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.domain.detail(id),
    queryFn: () => DomainService.findOne(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: id > 0,
  });

export function useDomainDetailQuery(id: number) {
  return useQuery(domainDetailQueryOptions(id));
}

export function useCreateDomainMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDomainDto) => DomainService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.domain.list(),
      });
    },
  });
}

export function useUpdateDomainMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateDomainDto }) =>
      DomainService.update(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.domain.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.domain.list(),
      });
    },
  });
}

export function useDeleteDomainMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DomainService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.domain.list(),
      });
    },
  });
}
