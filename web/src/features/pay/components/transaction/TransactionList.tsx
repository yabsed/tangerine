import { PayTransaction } from '@/features/pay/api/payApi';
import { Button } from '@/shared/ui';
import { TransactionItem } from './TransactionItem';
import { useTranslation } from '@/shared/i18n';

interface TransactionListProps {
  transactions: PayTransaction[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId?: string;
  emptyMessage?: string;
}

export function TransactionList({
  transactions,
  isLoading,
  hasMore,
  onLoadMore,
  currentUserId,
  emptyMessage,
}: TransactionListProps) {
  const t = useTranslation();

  if (isLoading && transactions.length === 0) {
    return (
      <p className="text-text-tertiary text-sm text-center py-8">
        {t.common.loading}
      </p>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="text-text-tertiary text-sm text-center py-8">
        {emptyMessage || t.pay.noTransactions}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <TransactionItem key={tx.id} tx={tx} currentUserId={currentUserId} />
      ))}
      {hasMore && (
        <Button
          onClick={onLoadMore}
          variant="outline"
          size="sm"
          fullWidth
          disabled={isLoading}
          className="mt-4"
        >
          {isLoading ? t.common.loading : t.common.loadMore}
        </Button>
      )}
    </div>
  );
}
