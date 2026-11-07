import { useUser } from '@/features/user/hooks/useUser';
import { useMyPay } from '@/features/pay/hooks/useMyPay';
import { useTranslation } from '@/shared/i18n';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { OnboardingRequired } from '@/shared/ui';
import { CoinPanel } from '@/features/pay/components/coin';

export default function CoinTab() {
  const t = useTranslation();
  const { user, needsOnboarding } = useUser();
  const { depositCoin, withdrawCoin } = useMyPay();

  if (needsOnboarding) {
    return (
      <PageContainer title={t.pay.coinManagement}>
        <OnboardingRequired />
      </PageContainer>
    );
  }

  return (
    <CoinPanel
      currentCoin={user?.coin || 0}
      onDeposit={depositCoin}
      onWithdraw={withdrawCoin}
    />
  );
}
