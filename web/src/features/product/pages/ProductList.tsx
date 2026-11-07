import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/features/product/components/list/ProductCard";
import SearchBar from "@/features/product/components/list/SearchBar";
import { useProducts } from "@/features/product/hooks/useProducts";
import { PageContainer } from "@/shared/layouts/PageContainer";
import { DataListLayout } from "@/shared/layouts/DataListLayout";
import { useRegionSelection } from "@/features/location/hooks/useRegionSelection";
import RegionSelector from "@/features/location/components/RegionSelector";
import RegionSelectModal from "@/features/location/components/RegionSelectModal";
import { useTranslation } from "@/shared/i18n";
import { SegmentedTabBar, Pagination } from "@/shared/ui";
import { useProductFilters } from "@/features/product/store/productFiltersStore";
import { Group, SimpleGrid, Stack } from "@mantine/core";

const ITEMS_PER_PAGE = 12;

export default function ProductList() {
  const t = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentRegionId,
    currentRegionName,
    currentSido,
    currentSigugun,
    isModalOpen,
    openModal,
    closeModal,
    handleRegionSelect,
    handleSidoSelect,
    handleSigugunSelect,
  } = useRegionSelection();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // URL 쿼리 파라미터에서 auction 값 읽기 (기본값: false)
  const auctionParam = searchParams.get("auction");
  const showAuction = auctionParam === "true";

  // 판매 상태 필터: 'onSale' | 'sold'
  const saleStatusParam = searchParams.get("saleStatus") ?? "onSale";
  const saleStatus = saleStatusParam as "onSale" | "sold";

  // Sync current filters to store for navigation persistence
  const { setFilters } = useProductFilters();
  useEffect(() => {
    setFilters({
      region: currentRegionId,
      sido: currentSido,
      sigugun: currentSigugun,
      auction: showAuction,
    });
  }, [currentRegionId, currentSido, currentSigugun, showAuction, setFilters]);

  const handleAuctionChange = (value: boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("auction", String(value));
      return next;
    }, { replace: true });
    setCurrentPage(1);
  };

  const handleSaleStatusChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("saleStatus", value);
      return next;
    }, { replace: true });
    setCurrentPage(1);
  };

  // 지역 필터: 동 단위, 시/구/군 단위, 시/도 단위 모두 지원
  const { products: allProducts, loading, error } = useProducts({
    search: searchQuery,
    regionId: currentRegionId,
    sido: currentSido,
    sigugun: currentSigugun,
    auction: showAuction,
  });

  // 판매 상태 필터링
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    if (saleStatus === "onSale") return allProducts.filter((p) => !p.is_sold);
    return allProducts.filter((p) => p.is_sold);
  }, [allProducts, saleStatus]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, saleStatus, showAuction, currentRegionId]);

  const filterOptions = [
    { value: false, label: t.product.regular },
    { value: true, label: t.auction.auction },
  ] as const;

  const saleStatusOptions = [
    { id: "onSale", label: t.product.onSale },
    { id: "sold", label: t.product.soldOut },
  ];

  return (
    <PageContainer title={t.product.usedGoods}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <RegionSelector regionName={currentRegionName} onClick={openModal} />
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </Group>

        <Group gap="md" wrap="wrap">
          <SegmentedTabBar
            tabs={filterOptions.map((opt) => ({ id: String(opt.value), label: opt.label }))}
            activeTab={String(showAuction)}
            onTabChange={(tab) => handleAuctionChange(tab === 'true')}
          />
          <SegmentedTabBar
            tabs={saleStatusOptions}
            activeTab={saleStatus}
            onTabChange={handleSaleStatusChange}
          />
        </Group>

        <DataListLayout
          isLoading={loading}
          error={error}
          isEmpty={filteredProducts.length === 0}
          emptyMessage={searchQuery ? t.product.noSearchResults : t.product.noProducts}
        >
          <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing="lg">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </DataListLayout>
      </Stack>
      <RegionSelectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSelect={handleRegionSelect}
        onSelectSido={handleSidoSelect}
        onSelectSigugun={handleSigugunSelect}
        initialRegionId={currentRegionId}
      />
    </PageContainer>
  );
}
