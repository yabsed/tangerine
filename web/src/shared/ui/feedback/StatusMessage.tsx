import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../display/Button';
import { useTranslation } from '@/shared/i18n';
import { Alert, Center, Group, Loader, Stack, Text, ThemeIcon } from '@mantine/core';

export const Loading = () => {
  const t = useTranslation();
  return (
    <Center py="xl" w="100%">
      <Group gap="sm">
        <Loader size="sm" color="orange" />
        <Text c="dimmed" size="sm" fw={500}>
          {t.common.loading}
        </Text>
      </Group>
    </Center>
  );
};

export const ErrorMessage = ({ message }: { message: string }) => (
  <Alert color="red" title="Error" variant="light">
    {message}
  </Alert>
);

export const EmptyState = ({ message }: { message: string }) => (
  <Center py="xl" w="100%">
    <Text c="dimmed">{message}</Text>
  </Center>
);

export const LoginRequired = ({ message }: { message?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  const currentPath = location.pathname + location.search;
  return (
    <Center py={80} px="md">
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
            <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </ThemeIcon>
        <Text c="dimmed">{message || t.auth.pleaseLogin}</Text>
        <Button onClick={() => navigate(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)} size="sm">
          {t.auth.login}
        </Button>
      </Stack>
    </Center>
  );
};

export const OnboardingRequired = ({ message }: { message?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  const currentPath = location.pathname + location.search;
  return (
    <Center py={80} px="md">
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
            <path d="M16.586 3.586a2 2 0 112.828 2.828L11.828 14H9v-2.828l7.586-7.586z" />
          </svg>
        </ThemeIcon>
        <Text c="dimmed">{message || t.auth.completeSettings}</Text>
        <Button onClick={() => navigate(`/auth/onboarding?redirect=${encodeURIComponent(currentPath)}`)} size="sm">
          {t.auth.goToSettings}
        </Button>
      </Stack>
    </Center>
  );
};
