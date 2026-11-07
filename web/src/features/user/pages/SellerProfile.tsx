import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Group, SimpleGrid, Text } from '@mantine/core';
import { useUser, useUserProfile } from '@/features/user/hooks/useUser';
import { useUserProducts } from '@/features/product/hooks/useProducts';
import { useCreateRoom } from '@/features/chat/hooks/useChat';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { Loading, ErrorMessage, EmptyState, Button, DetailHeader, DetailSection, Avatar, Pagination, SegmentedTabBar } from '@/shared/ui';
import { DataListLayout } from '@/shared/layouts/DataListLayout';
import ProductCard from '@/features/product/components/list/ProductCard';
import { useTranslation } from '@/shared/i18n';

const ITEMS_PER_PAGE = 8;

function SellerProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile(userId);
  const createRoom = useCreateRoom();
  const t = useTranslation();

  const [showAuction, setShowAuction] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { products: regularProducts, loading: regularLoading, error: regularError } = useUserProducts(userId || '', undefined, undefined, false);
  const { products: auctionProducts, loading: auctionLoading, error: auctionError } = useUserProducts(userId || '', undefined, undefined, true);

  const productsLoading = regularLoading || auctionLoading;
  const productsError = regularError || auctionError;
  const currentProducts = showAuction ? auctionProducts : regularProducts;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentProducts, currentPage]);

  const totalPages = Math.ceil(currentProducts.length / ITEMS_PER_PAGE);

  const handleTabChange = (isAuction: boolean) => {
    setShowAuction(isAuction);
    setCurrentPage(1);
  };

  const isOwnProfile = String(user?.id) === userId;

  const handleChatClick = () => {
    if (!userId) return;
    if (!isLoggedIn) return navigate('/auth/login');
    if (isOwnProfile) return;

    createRoom.mutate(userId, {
      onSuccess: (roomId) => navigate(`/chat/${roomId}`),
      onError: () => alert(t.chat.cannotOpenRoom),
    });
  };

  if (profileLoading) return <Loading />;
  if (profileError) return <ErrorMessage message={t.user.profileLoadFailed} />;
  if (!profile) return <EmptyState message={t.user.userNotFound} />;

  return (
    <PageContainer>
      <DetailHeader />

      {/* 판매자 프로필 섹션 */}
      <DetailSection style={{ marginBottom: 'var(--mantine-spacing-lg)' }}>
        <Group justify="space-between">
          <Group gap="md">
            <Avatar
              src={profile.profile_image || undefined}
              alt={profile.nickname || undefined}
              size="lg"
            />
            <Box>
              <Text size="xl" fw={700} c="var(--text-heading)">{profile.nickname}</Text>
            </Box>
          </Group>
          {!isOwnProfile && (
            <Button onClick={handleChatClick} disabled={createRoom.isPending}>
              {createRoom.isPending ? t.product.connecting : t.product.startChat}
            </Button>
          )}
        </Group>
      </DetailSection>

      {/* 판매 상품 목록 */}
      <Box>
        <Text size="lg" fw={700} mb="md">{profile.nickname}{t.user.sellerSalesItems}</Text>
        <Box mb="md">
          <SegmentedTabBar
            tabs={[
              { id: 'regular', label: t.product.regular },
              { id: 'auction', label: t.auction.auction },
            ]}
            activeTab={showAuction ? 'auction' : 'regular'}
            onTabChange={(tab) => handleTabChange(tab === 'auction')}
          />
        </Box>
        <DataListLayout
          isLoading={productsLoading}
          error={productsError}
          isEmpty={currentProducts.length === 0}
          emptyMessage={showAuction ? t.auction.noAuctions : t.product.noProducts}
        >
          <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing="md">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </DataListLayout>
      </Box>
    </PageContainer>
  );
}

export default SellerProfile;
