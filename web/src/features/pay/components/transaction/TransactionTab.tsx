import { useTransactions } from '@/features/pay/hooks/useTransactions';
import { useUser } from '@/features/user/hooks/useUser';
import { useTranslation } from '@/shared/i18n';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { OnboardingRequired } from '@/shared/ui';
import { TransactionList } from './TransactionList';

export default function TransactionTab() {
  const t = useTranslation();
  const { user, needsOnboarding } = useUser();
  const { transactions, isLoading, loadMore, hasMore } = useTransactions();

  if (needsOnboarding) {
    return (
      <PageContainer title={t.pay.coinManagement}>
        <OnboardingRequired />
      </PageContainer>
    );
  }

  return (
    <TransactionList
      transactions={transactions}
      isLoading={isLoading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      currentUserId={user?.id?.toString()}
    />
  );
}
