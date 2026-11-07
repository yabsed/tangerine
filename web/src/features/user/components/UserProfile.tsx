import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { useUserProducts, useCreateProduct } from "@/features/product/hooks/useProducts";
import { Button, DetailSection, Pagination, SegmentedTabBar } from '@/shared/ui';
import ProductCard from "@/features/product/components/list/ProductCard";
import ProductForm from "@/features/product/components/form/ProductForm";
import { useTranslation } from '@/shared/i18n';

import { useUser } from '@/features/user/hooks/useUser';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { OnboardingRequired } from '@/shared/ui';
import { DataListLayout } from '@/shared/layouts/DataListLayout';

const ITEMS_PER_PAGE = 8;

type SalesTab = 'regular' | 'auction';

const SALES_TAB_PARAM = 'sale';

function parseSalesTab(value: string | null): SalesTab | null {
  if (value === 'regular' || value === 'auction') return value;
  return null;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const createProduct = useCreateProduct();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const salesTab: SalesTab = parseSalesTab(searchParams.get(SALES_TAB_PARAM)) ?? 'regular';
  const showAuction = salesTab === 'auction';

  useEffect(() => {
    const parsed = parseSalesTab(searchParams.get(SALES_TAB_PARAM));
    if (parsed) return;

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(SALES_TAB_PARAM, 'regular');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [salesTab]);

  const { products: regularProducts, loading: regularLoading, error: regularError } = useUserProducts('me', undefined, undefined, false);
  const { products: auctionProducts, loading: auctionLoading, error: auctionError } = useUserProducts('me', undefined, undefined, true);

  const productsLoading = regularLoading || auctionLoading;
  const productsError = regularError || auctionError;

  const currentProducts = showAuction ? auctionProducts : regularProducts;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentProducts, currentPage]);

  const totalPages = Math.ceil(currentProducts.length / ITEMS_PER_PAGE);

  const handleTabChange = (tab: SalesTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(SALES_TAB_PARAM, tab);
      return next;
    }, { replace: true });
  };

  const handleSubmit = async (data: { title: string; price: number; content: string; image_ids?: string[]; isAuction?: boolean; auctionEndAt?: string }) => {
    const { isAuction, auctionEndAt, ...productData } = data;
    const newProduct = await createProduct.mutateAsync({
      ...productData,
      image_ids: productData.image_ids ?? [],
      category_id: '1',
      ...(isAuction && auctionEndAt ? { auction: { end_at: new Date(auctionEndAt).toISOString() } } : {}),
    });
    alert(isAuction ? t.auction.registered : t.product.productRegistered);
    setShowForm(false);
    navigate(`/products/${newProduct.id}`);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const { needsOnboarding } = useUser();

  if (needsOnboarding) {
      return (
        <PageContainer title="채팅">
          <OnboardingRequired />
        </PageContainer>
      );
    }

  return (
    <Stack gap="xl">
      {!showForm ? (
        <Group justify="flex-end">
          <Button size="sm" onClick={() => setShowForm(true)}>
            {t.product.registerProduct}
          </Button>
        </Group>
      ) : (
        <DetailSection>
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createProduct.isPending}
          />
        </DetailSection>
      )}

      <Box>
        <Text size="lg" fw={700} mb="md">{t.product.mySalesItems}</Text>
        <Box mb="md">
          <SegmentedTabBar
            tabs={[
              { id: 'regular', label: t.product.regular },
              { id: 'auction', label: t.auction.auction },
            ]}
            activeTab={salesTab}
            onTabChange={handleTabChange}
          />
        </Box>

        <DataListLayout
          isLoading={productsLoading}
          error={productsError}
          isEmpty={currentProducts.length === 0}
          emptyMessage={showAuction ? t.auction.noAuctions : t.product.noSalesItems}
        >
          <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing="md">
            {paginatedProducts.map(p => (
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
      </Box>
    </Stack>
  );
};

export default UserProfile;
