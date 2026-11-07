import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { payApi, PayTransaction } from '@/features/pay/api/payApi';
import { useToken } from '@/features/auth/hooks/store';

const ITEMS_PER_PAGE = 10;

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (offset: number) => [...transactionKeys.all, 'list', offset] as const,
  partner: (partnerId: string, offset: number) => [...transactionKeys.all, 'partner', partnerId, offset] as const,
};

interface UseTransactionsOptions {
  partnerId?: string;
  refetchInterval?: number | false;
}

export function useTransactions(options?: UseTransactionsOptions) {
  const { partnerId, refetchInterval } = options || {};
  const token = useToken();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [allTransactions, setAllTransactions] = useState<PayTransaction[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const queryKey = partnerId
    ? transactionKeys.partner(partnerId, offset)
    : transactionKeys.list(offset);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => payApi.getTransactions({
      limit: ITEMS_PER_PAGE,
      offset,
      partner_id: partnerId,
    }),
    enabled: !!token,
    staleTime: 1000 * 60,
    refetchInterval,
  });

  // Reset state when partnerId changes
  useEffect(() => {
    setOffset(0);
    setAllTransactions([]);
    setHasMore(true);
  }, [partnerId]);

  // Sync query data to state
  useEffect(() => {
    if (data) {
      if (offset === 0) {
        setAllTransactions(data);
      } else {
        setAllTransactions((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = data.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
      }
      setHasMore(data.length === ITEMS_PER_PAGE);
    }
  }, [data, offset]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setOffset((prev) => prev + ITEMS_PER_PAGE);
    }
  };

  const invalidate = () => {
    setOffset(0);
    setAllTransactions([]);
    setHasMore(true);
    if (partnerId) {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'partner', partnerId] });
    } else {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    }
  };

  return {
    transactions: allTransactions,
    isLoading,
    error,
    refetch,
    invalidate,
    loadMore,
    hasMore,
  };
}
