import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useProducts } from "@/features/product/hooks/useProducts";
import { productApi } from "@/features/product/api/product";
import { Pagination, SegmentedTabBar } from '@/shared/ui';
import ProductCard from "@/features/product/components/list/ProductCard";
import { useTranslation } from '@/shared/i18n';
import { useUser } from '@/features/user/hooks/useUser';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { OnboardingRequired } from '@/shared/ui';
import { DataListLayout } from '@/shared/layouts/DataListLayout';
import { payApi } from '@/features/pay/api/payApi';
import type { ProductDetailResponse } from '@/shared/api/types';
import { useSearchParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 8;

type BidsTab = 'active' | 'unpaid' | 'paid';

const BIDS_TAB_PARAM = 'bids';

function parseBidsTab(value: string | null): BidsTab | null {
  if (value === 'active' || value === 'unpaid' || value === 'paid') return value;
  return null;
}

const MyBidsTab = () => {
  const t = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, needsOnboarding } = useUser();

  const bidsTab: BidsTab = parseBidsTab(searchParams.get(BIDS_TAB_PARAM)) ?? 'active';

  useEffect(() => {
    const parsed = parseBidsTab(searchParams.get(BIDS_TAB_PARAM));
    if (parsed) return;

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(BIDS_TAB_PARAM, 'active');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bidsTab]);

  // 1. Fetch all auction products
  const { products: auctionProducts, loading: productsLoading, error: productsError } = useProducts({ auction: true });

  // 2. Fetch product details to get auction IDs
  const productDetailQueries = useQueries({
    queries: (auctionProducts ?? []).map(product => ({
      queryKey: ['products', 'detail', product.id],
      queryFn: () => productApi.getById(product.id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const productDetails = productDetailQueries.map(q => q.data).filter(Boolean);
  const productDetailsLoading = productDetailQueries.some(q => q.isLoading);

  // 3. Fetch top bidder for each auction
  const topBidQueries = useQueries({
    queries: productDetails
      .filter(p => p?.auction?.id)
      .map(product => ({
        queryKey: ['auction', 'topBid', product!.auction!.id],
        queryFn: () => productApi.getTopBid(product!.auction!.id),
        staleTime: 1000 * 30,
      })),
  });

  const topBidsLoading = topBidQueries.some(q => q.isLoading);

  // 4. Filter products where current user is top bidder
  const winningAuctions = useMemo(() => {
    if (!user?.id) return [];

    return productDetails.filter(product => {
      if (!product?.auction?.id) return false;

      const topBidQuery = topBidQueries.find(
        q => q.data?.auction_id === product.auction!.id
      );

      return topBidQuery?.data?.bidder_id === user.id;
    });
  }, [productDetails, topBidQueries, user?.id]);

  // 5. Get unique owner IDs from ended auctions for payment check
  const endedAuctions = useMemo(() => {
    return winningAuctions.filter(product => {
      const auction = product?.auction;
      if (!auction) return false;
      const endAt = auction.end_at.endsWith('Z') || auction.end_at.includes('+') ? auction.end_at : auction.end_at + 'Z';
      return auction.status !== 'active' || new Date(endAt).getTime() <= Date.now();
    });
  }, [winningAuctions]);

  const ownerIds = useMemo(() => {
    return [...new Set(endedAuctions.map(p => p?.owner_id).filter(Boolean))];
  }, [endedAuctions]);

  // 6. Fetch transactions for each owner to check payments
  const transactionQueries = useQueries({
    queries: ownerIds.map(ownerId => ({
      queryKey: ['transactions', 'auctionPayment', ownerId],
      queryFn: () => payApi.getTransactions({ partner_id: ownerId, limit: 50 }),
      staleTime: 1000 * 30,
      enabled: !!ownerId,
    })),
  });

  const transactionsLoading = transactionQueries.some(q => q.isLoading);
  const transactionsError = transactionQueries.find(q => q.error)?.error as Error | undefined;

  // 7. Check if a specific auction has been paid
  const checkAuctionPaid = (product: ProductDetailResponse | undefined): boolean => {
    if (!product?.auction || !product.owner_id) return false;

    const ownerIndex = ownerIds.indexOf(product.owner_id);
    if (ownerIndex === -1) return false;

    const transactions = transactionQueries[ownerIndex]?.data;
    if (!transactions) return false;

    return transactions.some(tx =>
      tx.type === 'TRANSFER' &&
      tx.details.description.includes('[Auction] 낙찰 완료') &&
      tx.details.amount === product.auction!.current_price
    );
  };

  // 8. Split auctions by status
  const activeAuctions = useMemo(() => {
    return winningAuctions.filter(product => {
      const auction = product?.auction;
      if (!auction) return false;
      const endAt = auction.end_at.endsWith('Z') || auction.end_at.includes('+') ? auction.end_at : auction.end_at + 'Z';
      return auction.status === 'active' && new Date(endAt).getTime() > Date.now();
    });
  }, [winningAuctions]);

  // 9. Split ended auctions by payment status
  const unpaidAuctions = useMemo(() => {
    return endedAuctions.filter(product => !checkAuctionPaid(product));
  }, [endedAuctions, transactionQueries]);

  const paidAuctions = useMemo(() => {
    return endedAuctions.filter(product => checkAuctionPaid(product));
  }, [endedAuctions, transactionQueries]);

  // 10. Get current list based on tabs
  const currentAuctions = useMemo(() => {
    if (bidsTab === 'active') return activeAuctions;
    if (bidsTab === 'unpaid') return unpaidAuctions;
    return paidAuctions;
  }, [bidsTab, activeAuctions, unpaidAuctions, paidAuctions]);

  const paginatedAuctions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentAuctions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentAuctions, currentPage]);

  const totalPages = Math.ceil(currentAuctions.length / ITEMS_PER_PAGE);

  const handleBidsTabChange = (tab: BidsTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(BIDS_TAB_PARAM, tab);
      return next;
    }, { replace: true });
  };

  if (needsOnboarding) {
    return (
      <PageContainer>
        <OnboardingRequired />
      </PageContainer>
    );
  }

  const isLoading = productsLoading || productDetailsLoading || topBidsLoading || transactionsLoading;
  const error =
    productsError ||
    (productDetailQueries.find(q => q.error)?.error as Error | undefined) ||
    (topBidQueries.find(q => q.error)?.error as Error | undefined) ||
    transactionsError;

  const getEmptyMessage = () => {
    return t.auction.noMyBids;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* Single-layer Tabs: In progress / Unpaid / Paid */}
        <div className="mb-4">
          <SegmentedTabBar
            tabs={[
              { id: 'active', label: t.auction.inProgress },
              { id: 'unpaid', label: t.auction.auctionUnpaid },
              { id: 'paid', label: t.auction.auctionPaid },
            ]}
            activeTab={bidsTab}
            onTabChange={handleBidsTabChange}
          />
        </div>

        <DataListLayout
          isLoading={isLoading}
          error={error}
          isEmpty={currentAuctions.length === 0}
          emptyMessage={getEmptyMessage()}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedAuctions.map(product => (
              <ProductCard key={product!.id} product={product!} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </DataListLayout>
      </div>
    </div>
  );
};

export default MyBidsTab;
