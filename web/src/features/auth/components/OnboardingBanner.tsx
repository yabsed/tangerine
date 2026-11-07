import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@/features/user/hooks/useUser';
import { useTranslation } from '@/shared/i18n';
import { Alert, Button, Group, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

export function OnboardingBanner() {
  const { user, needsOnboarding } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  // 채팅방에서는 배너 숨김
  const isChatRoom = location.pathname.startsWith('/chat/');
  const shouldShowBanner = user && needsOnboarding && !isChatRoom;

  if (!shouldShowBanner) return null;

  return (
    <Alert
      variant="light"
      color="orange"
      radius={0}
      py="xs"
      icon={false}
      bg="var(--color-brand-light)"
    >
      <Group justify="center" gap="md">
        <Text size="sm" fw={500} c="var(--text-primary)">
          {t.auth.onboardingRequired}
        </Text>
        <Button
          variant="filled"
          color="orange"
          size="xs"
          radius="xl"
          rightSection={<IconChevronRight size={14} />}
          onClick={() => navigate('/auth/onboarding')}
        >
          {t.auth.goToSettings}
        </Button>
      </Group>
    </Alert>
  );
}
