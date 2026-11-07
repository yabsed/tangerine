import { useTransactions } from '@/features/pay/hooks/useTransactions';
import { useUser } from '@/features/user/hooks/useUser';
import { useTranslation } from '@/shared/i18n';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { DetailHeader, OnboardingRequired } from '@/shared/ui';
import { TransactionList } from '@/features/pay/components/transaction';

function TransactionHistory() {
  const t = useTranslation();
  const { user, needsOnboarding } = useUser();
  const { transactions, isLoading, loadMore, hasMore } = useTransactions();

  if (needsOnboarding) {
    return (
      <PageContainer title={t.pay.transactionHistory}>
        <OnboardingRequired />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DetailHeader />
      <h2 className="text-2xl font-extrabold mb-6">{t.pay.transactionHistory}</h2>
      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        currentUserId={user?.id?.toString()}
      />
    </PageContainer>
  );
}

export default TransactionHistory;
