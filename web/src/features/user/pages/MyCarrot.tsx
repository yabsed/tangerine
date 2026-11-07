import { useNavigate } from 'react-router-dom';
import { Box, Group, Paper, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import ProfileEditForm from '@/features/user/components/ProfileEditForm';
import UserProfile from '@/features/user/components/UserProfile';
import MyBidsTab from '@/features/user/components/MyBidsTab';
import CoinTab from '@/features/pay/pages/CoinTab';
import TransactionTab from '@/features/pay/components/transaction/TransactionTab';
import { useAuth } from '@/features/auth/hooks/store';
import { Loading, Button, Avatar, DetailHeader } from '@/shared/ui';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { useTranslation } from '@/shared/i18n';

import { useOnboarding } from '@/features/user/hooks/useUser';
import { useUser } from '@/features/user/hooks/useUser';
import { POLLING_CONFIG } from '@/shared/config/polling';

type TabType = 'products' | 'bids' | 'profile' | 'coin' | 'transactions';

interface MyCarrotProps {
  initialTab?: TabType;
}

function MyCarrot({ initialTab }: MyCarrotProps) {
  const { user } = useUser({ refetchInterval: POLLING_CONFIG.USER_BALANCE });
  const { logout } = useAuth();
  const navigate = useNavigate();
  const onboardingMutation = useOnboarding();
  const t = useTranslation();

  const MENU_ITEMS: { id: TabType; label: string; to: string }[] = [
    { id: 'products', label: t.user.myProducts, to: '/my/products' },
    { id: 'bids', label: t.auction.myBids, to: '/my/bids' },
    { id: 'profile', label: t.user.editProfile, to: '/my/profile' },
    { id: 'coin', label: t.pay.coinManagement, to: '/my/coin' },
    { id: 'transactions', label: t.pay.transactionHistory, to: '/my/transactions' },
  ];

  if (!user) return <Loading />;

  const updateProfile = async (data: { nickname: string; region_id: string; profile_image: string }) => {
    if (!user) return;
    try {
      await onboardingMutation.mutateAsync(data);
      alert(t.user.infoUpdated);
    } catch (err) {
      console.error(err);
      alert(t.user.errorOccurred);
    }
  };

  // First layer: Menu list
  if (!initialTab) {
    return (
      <PageContainer>
        <Group justify="space-between" align="center" mb="xl">
          <Title order={2}>{t.user.myOrange}</Title>
          <Button onClick={() => { logout(); navigate('/products'); }} variant="outline" size="sm">{t.auth.logout}</Button>
        </Group>

        {/* User info section */}
        <Box p="xl" mb="md">
          <Stack align="center" gap="md">
            <Avatar
              src={user.profile_image || undefined}
              alt={user.nickname || t.common.unknown}
              size="lg"
            />
            <Stack align="center" gap={4}>
              <Text fw={700} fz="xl">{user.nickname || t.common.unknown}</Text>
              <Text c="dimmed" fz="sm">{user.email}</Text>
            </Stack>
          </Stack>
        </Box>

        {/* Menu list */}
        <Stack gap="sm">
          {MENU_ITEMS.map((item) => (
            <UnstyledButton
              key={item.id}
              onClick={() => navigate(item.to)}
              w="100%"
            >
              <Paper
                withBorder
                radius="md"
                p="md"
                style={{ transition: 'border-color 0.2s, color 0.2s' }}
                className="hover:border-primary hover:text-primary"
              >
                <Group justify="space-between" align="center">
                  <Text fw={500}>{item.label}</Text>
                  <IconChevronRight size={20} style={{ color: 'var(--mantine-color-dimmed)' }} />
                </Group>
              </Paper>
            </UnstyledButton>
          ))}
        </Stack>
      </PageContainer>
    );
  }

  // Second layer: Tab content with back button
  return (
    <PageContainer>
      <DetailHeader />
      <Title order={2} mb="lg">
        {MENU_ITEMS.find(item => item.id === initialTab)?.label}
      </Title>

      <Stack>
        {initialTab === 'products' && <UserProfile />}
        {initialTab === 'bids' && <MyBidsTab />}
        {initialTab === 'profile' && (
          <ProfileEditForm
            initialEmail={user.email}
            initialNickname={user.nickname || ''}
            initialRegionId={user.region?.id || ''}
            initialProfileImage={user.profile_image || ''}
            forceGPS={true}
            onSubmit={updateProfile}
          />
        )}
        {initialTab === 'coin' && <CoinTab />}
        {initialTab === 'transactions' && <TransactionTab />}
      </Stack>
    </PageContainer>
  );
}

export default MyCarrot;