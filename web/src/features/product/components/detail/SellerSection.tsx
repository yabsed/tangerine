import { Button, UserCard } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { useDetail } from '@/features/product/hooks/DetailContext';

export function SellerSection() {
  const t = useTranslation();
  const { sellerProfile, handleNavigateToSeller, handleChat, isChatLoading, isOwner } = useDetail();

  return (
    <UserCard
      profileImage={sellerProfile?.profile_image ?? undefined}
      nickname={sellerProfile?.nickname || t.common.unknown}
      subtitle={t.product.seller}
      onNavigate={handleNavigateToSeller}
      action={
        !isOwner && (
          <Button size="sm" onClick={handleChat} disabled={isChatLoading}>
            {isChatLoading ? t.product.connecting : t.product.startChat}
          </Button>
        )
      }
    />
  );
}
