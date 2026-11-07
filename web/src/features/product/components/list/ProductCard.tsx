import { useMemo, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '@/features/product/types';
import type { AuctionInfo } from '@/shared/api/types';
import { Card, CardContent, CardImage, Badge, Button as AppButton, Avatar } from '@/shared/ui';
import { useUserProfile } from '@/features/user/hooks/useUser';
import { useTranslation } from '@/shared/i18n';
import { formatPrice, formatRemainingTime } from '@/shared/lib/formatting';
import { useFirstImage } from '@/features/image';
import { Button as MantineButton, Group, Stack, Text } from '@mantine/core';

interface ProductCardProps {
  product: Product & { auction?: AuctionInfo };
  showActions?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export default function ProductCard({ product, showActions, onEdit, onDelete }: ProductCardProps) {
  const { profile } = useUserProfile(product.owner_id);
  const t = useTranslation();
  const firstImageUrl = useFirstImage(product.image_ids);

  const auction = product.auction;
  const isAuction = !!auction;
  const isAuctionEnded = Boolean(
    auction && (
      auction.status !== 'active' ||
      (auction.end_at ? new Date(auction.end_at.endsWith('Z') || auction.end_at.includes('+') ? auction.end_at : auction.end_at + 'Z').getTime() <= Date.now() : false)
    )
  );

  const timeLabels = useMemo(() => ({
    timeEnded: t.auction.timeEnded,
    days: t.auction.days,
    hours: t.auction.hours,
    minutes: t.auction.minutes,
    remaining: t.auction.remaining,
  }), [t]);

  const remainingTime = auction ? formatRemainingTime(auction.end_at, timeLabels) : '';

  const stop = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <Link
      to={`/products/${product.id}`}
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <Card>
        <CardContent>
          <Stack gap="sm">
            <Group gap="xs" wrap="nowrap">
              <Avatar src={profile?.profile_image ?? undefined} alt={profile?.nickname || t.product.seller} size="sm" />
              <Text size="sm" c="dimmed" lineClamp={1} style={{ flex: 1 }}>
                {profile?.nickname || t.common.unknown}
              </Text>
            </Group>

            <Group justify="space-between" align="center" wrap="nowrap">
              {isAuction ? (
                <>
                  <Badge variant={isAuctionEnded ? 'secondary' : 'primary'}>
                    {isAuctionEnded ? t.auction.ended : t.auction.inProgress}
                  </Badge>
                  {!isAuctionEnded && (
                    <Text size="xs" c="red" fw={600} lineClamp={1}>
                      {remainingTime}
                    </Text>
                  )}
                </>
              ) : (
                <Badge variant={product.is_sold ? 'secondary' : 'primary'}>
                  {product.is_sold ? t.product.soldOut : t.product.onSale}
                </Badge>
              )}
            </Group>

            <CardImage src={firstImageUrl} alt={product.title} aspectRatio="square" />

            <Text fw={700} lineClamp={1}>
              {product.title}
            </Text>

            {!isAuction && (
              <Text size="sm" c="dimmed" lineClamp={1} mih={24}>
                {product.content}
              </Text>
            )}

            <div style={{ minHeight: isAuction ? 64 : undefined }}>
              {isAuction ? (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    {t.auction.startingPrice}: {formatPrice(product.price, t.common.won)}
                  </Text>
                  <Text fw={800} c="orange">
                    {t.auction.currentPrice}: {formatPrice(auction.current_price, t.common.won)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t.auction.bidsCount.replace('{count}', String(auction.bid_count))}
                  </Text>
                </Stack>
              ) : (
                <Text fw={800} c="orange">
                  {formatPrice(product.price, t.common.won)}
                </Text>
              )}
            </div>

            {showActions && (
              <Group grow gap="sm">
                <AppButton onClick={(e) => { stop(e); onEdit?.(product); }} variant="secondary" size="sm">
                  {t.common.edit}
                </AppButton>
                <MantineButton
                  onClick={(e) => { stop(e); onDelete?.(product); }}
                  variant="subtle"
                  color="red"
                  size="sm"
                  fullWidth
                >
                  {t.common.delete}
                </MantineButton>
              </Group>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Link>
  );
}
