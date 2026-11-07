import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProduct, useUserProducts, usePlaceBid, useTopBidder } from "@/features/product/hooks/useProducts";
import { useUser, useUserProfile } from "@/features/user/hooks/useUser";
import { useTranslation } from "@/shared/i18n";
import { useDetailHandlers } from "./shared";
import { getErrorMessage } from "@/shared/api/types";
import { formatRemainingTime } from "@/shared/lib/formatting";
import { payApi } from "@/features/pay/api/payApi";
import { transactionKeys } from "@/features/pay/hooks/useTransactions";
import { userKeys } from "@/features/user/hooks/useUser";

export function useProductDetailLogic(productId: string) {
  const navigate = useNavigate();
  const t = useTranslation();
  const queryClient = useQueryClient();
  const { user, isLoggedIn } = useUser();

  const { product, loading: productLoading, error: productError, refetch } = useProduct(productId);
  const auctionInfo = product?.auction;
  const { profile: sellerProfile } = useUserProfile(product?.owner_id);
  const { products: sellerProducts } = useUserProducts(product?.owner_id!, undefined, undefined, false);
  const { products: sellerAuctions } = useUserProducts(product?.owner_id!, undefined, undefined, true);

  // Fetch top bidder info
  const { data: topBidder } = useTopBidder(auctionInfo?.id);
  const { profile: topBidderProfile } = useUserProfile(topBidder?.bidder_id);

  const placeBidMutation = usePlaceBid();
  const [bidPrice, setBidPrice] = useState('');
  const [remainingTime, setRemainingTime] = useState('');
  const [isPayingAuction, setIsPayingAuction] = useState(false);
  const auctionPaymentKeyRef = useRef<string>(crypto.randomUUID());

  const handlers = useDetailHandlers({ product, redirectPath: '/products', onEditSuccess: refetch });

  // Auction-specific logic (ended = status not active OR end_at has passed)
  const isAuction = !!auctionInfo;
  const isEnded = Boolean(
    auctionInfo && (
      auctionInfo.status !== 'active' ||
      (auctionInfo.end_at ? new Date(auctionInfo.end_at.endsWith('Z') || auctionInfo.end_at.includes('+') ? auctionInfo.end_at : auctionInfo.end_at + 'Z').getTime() <= Date.now() : false)
    )
  );
  const minBidPrice = auctionInfo ? auctionInfo.current_price + 1 : 0;
  const isTopBidder = topBidder && user?.id === topBidder.bidder_id;

  // Check if auction payment has been made (only when user is top bidder of ended auction)
  const shouldCheckAuctionPayment = Boolean(isAuction && isEnded && isTopBidder && product?.owner_id);
  const { data: auctionPaymentTransactions } = useQuery({
    queryKey: ['transactions', 'auctionPayment', product?.owner_id],
    queryFn: () => payApi.getTransactions({ partner_id: product?.owner_id, limit: 50 }),
    enabled: shouldCheckAuctionPayment,
    staleTime: 1000 * 30,
  });

  // Check if a matching auction payment exists
  const hasAuctionPayment = useMemo(() => {
    if (!auctionPaymentTransactions || !auctionInfo || !product) return false;
    return auctionPaymentTransactions.some((tx) =>
      tx.type === 'TRANSFER' &&
      tx.details.description.includes('[Auction] 낙찰 완료') &&
      tx.details.amount === auctionInfo.current_price
    );
  }, [auctionPaymentTransactions, auctionInfo, product]);

  // Handle auction payment
  const handleAuctionPayment = useCallback(async () => {
    if (!isLoggedIn) { navigate('/auth/login'); return; }
    if (!product || !auctionInfo || !sellerProfile) return;
    if (hasAuctionPayment) return;

    const amount = auctionInfo.current_price;
    const description = `[Auction] 낙찰 완료 (${amount.toLocaleString()}${t.common.won})`;

    setIsPayingAuction(true);
    try {
      await payApi.transfer({
        amount,
        description,
        request_key: auctionPaymentKeyRef.current,
        receive_user_id: product.owner_id,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'auctionPayment', product.owner_id] });
      auctionPaymentKeyRef.current = crypto.randomUUID();
      alert(t.auction.auctionPaymentSuccess);
    } catch (err) {
      alert(getErrorMessage(err, t.pay.transferFailed));
    } finally {
      setIsPayingAuction(false);
    }
  }, [isLoggedIn, product, auctionInfo, sellerProfile, hasAuctionPayment, queryClient, navigate, t]);

  const timeLabels = useMemo(() => ({
    timeEnded: t.auction.timeEnded,
    days: t.auction.days,
    hours: t.auction.hours,
    minutes: t.auction.minutes,
    seconds: t.auction.seconds,
  }), [t]);

  useEffect(() => {
    if (!auctionInfo) return;
    const update = () => setRemainingTime(formatRemainingTime(auctionInfo.end_at, timeLabels));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [auctionInfo, timeLabels]);

  const handleBid = useCallback(async () => {
    if (!isLoggedIn) { navigate('/auth/login'); return; }

    const price = parseInt(bidPrice, 10);
    if (isNaN(price) || price <= 0) { alert(t.auction.invalidAmount); return; }
    if (auctionInfo && price <= auctionInfo.current_price) {
      alert(t.auction.bidHigherThanCurrent.replace('{price}', auctionInfo.current_price.toLocaleString()));
      return;
    }

    if (!auctionInfo || !product) return;

    try {
      await placeBidMutation.mutateAsync({ auctionId: auctionInfo.id, productId: product.id, data: { bid_price: price } });
      setBidPrice('');
      refetch();
      alert(t.auction.bidPlaced);
    } catch (err) {
      alert(getErrorMessage(err, t.auction.bidFailed));
    }
  }, [isLoggedIn, bidPrice, auctionInfo, product, placeBidMutation, refetch, navigate, t]);

  // Combine product and auction info into shape expected by AuctionInfoSection
  const auction = auctionInfo ? { ...auctionInfo, product } : undefined;

  return {
    product,
    auction,
    sellerProfile,
    sellerProducts,
    sellerAuctions,
    productLoading,
    productError,
    // Auction-specific
    isAuction,
    isEnded,
    remainingTime,
    bidPrice,
    minBidPrice,
    isBidding: placeBidMutation.isPending,
    handleBid,
    setBidPrice,
    refetch,
    // Top bidder
    topBidder,
    topBidderProfile,
    // Auction payment (for winner)
    isTopBidder,
    hasAuctionPayment,
    isPayingAuction,
    handleAuctionPayment,
    ...handlers,
  };
}
