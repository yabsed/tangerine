import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProfileEditForm from '@/features/user/components/ProfileEditForm';
import { useOnboarding } from '@/features/user/hooks/useUser';
import { useTranslation } from '@/shared/i18n';
import { getErrorMessage } from '@/shared/api/types';
import { useToken } from '@/features/auth/hooks/store';
import { Alert, Paper, Stack, Text, Title } from '@mantine/core';
import { PageContainer } from '@/shared/layouts/PageContainer';

export default function Onboarding() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useTranslation();
  const redirect = searchParams.get('redirect') || '/products';
  const onboardingMutation = useOnboarding();
  const token = useToken();

  const handleOnboardingSubmit = async (data: { nickname: string; region_id: string; profile_image: string }) => {
     setError('');
      if (!token) {
          navigate('/auth/login');
          return;
      }

      try {
        await onboardingMutation.mutateAsync(data);
        // Keep URL as the single source of truth for region selection.
        // Append the selected region id as a query param so useRegionSelection
        // on the product page will pick it up and sync the store.
        const separator = redirect.includes('?') ? '&' : '?';
        navigate(`${redirect}${separator}region=${encodeURIComponent(data.region_id)}`);
      } catch (err: unknown) {
        const detail = getErrorMessage(err, t.auth.onboardingFailed);
        throw new Error(detail);
      }
  };

  return (
    <PageContainer>
      <Paper withBorder radius="md" p="xl" maw={720} mx="auto" mt={40}>
        <Stack gap="sm">
          <Title order={2}>{t.auth.additionalInfo}</Title>
          <Text c="dimmed">{t.auth.onboardingDesc}</Text>

          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          <ProfileEditForm
            initialProfileImage=""
            submitButtonText={t.auth.getStarted}
            forceGPS={true}
            onSubmit={async (data) => {
              try {
                await handleOnboardingSubmit(data);
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : t.auth.onboardingFailed);
              }
            }}
          />
        </Stack>
      </Paper>
    </PageContainer>
  );
}
