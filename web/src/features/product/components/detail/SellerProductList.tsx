import { useState, useMemo } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useDetail } from '@/features/product/hooks/DetailContext';
import ProductCard from '@/features/product/components/list/ProductCard';
import { Pagination, SegmentedTabBar } from '@/shared/ui';
import { DataListLayout } from '@/shared/layouts/DataListLayout';
import { SimpleGrid, Stack, Title } from '@mantine/core';

const ITEMS_PER_PAGE = 4;

export function SellerProductList() {
  const t = useTranslation();
  const { product, sellerProducts, sellerAuctions, sellerProfile } = useDetail();

  const [showAuction, setShowAuction] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    return (sellerProducts || []).filter(p => p.owner_id === product.owner_id && p.id !== product.id);
  }, [sellerProducts, product.owner_id, product.id]);

  const filteredAuctions = useMemo(() => {
    return (sellerAuctions || []).filter(p => p.owner_id === product.owner_id && p.id !== product.id);
  }, [sellerAuctions, product.owner_id, product.id]);

  const currentItems = showAuction ? filteredAuctions : filteredProducts;

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentItems, currentPage]);

  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);

  const handleTabChange = (isAuction: boolean) => {
    setShowAuction(isAuction);
    setCurrentPage(1);
  };

  if (filteredProducts.length === 0 && filteredAuctions.length === 0) return null;

  const nickname = sellerProfile?.nickname || t.product.seller;

  return (
    <Stack gap="md" mt="xl">
      <Title order={3} size="h4">
        {nickname}{t.product.salesItems}
      </Title>

      <SegmentedTabBar
        tabs={[
          { id: 'regular', label: t.product.regular },
          { id: 'auction', label: t.auction.auction },
        ]}
        activeTab={showAuction ? 'auction' : 'regular'}
        onTabChange={(tab) => handleTabChange(tab === 'auction')}
      />

      <DataListLayout
        isLoading={false}
        error={undefined}
        isEmpty={currentItems.length === 0}
        emptyMessage={showAuction ? t.auction.noAuctions : t.product.noProducts}
      >
        <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing="md">
          {paginatedItems.map(p => (
            <ProductCard key={p.id} product={p} />
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
    </Stack>
  );
}
