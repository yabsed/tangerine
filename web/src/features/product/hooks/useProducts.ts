import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, ProductListParams } from '../api/product';
import { useRegionFilter } from './shared';
import type { CreateProductRequest, UpdateProductRequest } from '../types';
import type { PlaceBidRequest } from '@/shared/api/types';
import { useUser } from '@/features/user/hooks/useUser';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListParams) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProducts(options: { regionId?: string; sido?: string; sigugun?: string; userId?: string; category?: string; search?: string; auction?: boolean } = {}) {
  const { regionId, sido, sigugun, userId, category, search, auction } = options;
  const { user } = useUser();

  // Resolve 'me' to actual user ID for client-side filtering
  const resolvedUserId = userId === 'me' ? user?.id : userId;

  // Don't pass seller to API - server-side filtering doesn't work
  const params: ProductListParams = {
    category: category === 'all' ? undefined : category,
    search: search?.trim() || undefined,
    auction,
  };

  const queryInfo = useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.getList(params, true),
    staleTime: 1000 * 60 * 5, // 5분 동안 캐시 유지
  });

  const { filtered: regionFiltered, isFiltering } = useRegionFilter(queryInfo.data, { regionId, sido, sigugun }, queryInfo.isLoading);

  // Client-side seller filtering
  const filtered = useMemo(() => {
    if (!regionFiltered || !resolvedUserId) return regionFiltered;
    return regionFiltered.filter((product) => product.owner_id === resolvedUserId);
  }, [regionFiltered, resolvedUserId]);

  return {
    products: filtered,
    loading: queryInfo.isLoading || isFiltering,
    error: queryInfo.error as Error | null,
  };
}

// 단일 상품 조회
export function useProduct(productId: string) {
  const queryInfo = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productApi.getById(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5분 동안 캐시 유지
  });

  return {
    product: queryInfo.data,
    loading: queryInfo.isLoading,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  };
}

// Mutation Hooks
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      productApi.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(result.id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// 기존 호환성을 위한 alias (필요 없으면 삭제 가능)
export const useUserProducts = (userId: string, category?: string, search?: string, auction?: boolean) =>
  useProducts({ userId, category, search, auction });

export function usePlaceBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, data }: { auctionId: string; productId: string; data: PlaceBidRequest }) =>
      productApi.placeBid(auctionId, data),
    onSuccess: (_, variables) => {
      // Invalidate product detail and top bidder queries
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: ['auction', 'topBid', variables.auctionId] });
    },
  });
}

export function useTopBidder(auctionId: string | undefined) {
  return useQuery({
    queryKey: ['auction', 'topBid', auctionId],
    queryFn: () => productApi.getTopBid(auctionId!),
    enabled: !!auctionId,
    staleTime: 1000 * 30, // 30초 캐시
  });
}
