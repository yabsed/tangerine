import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/features/auth/api/auth';
import { useAuth } from '@/features/auth/hooks/store';
import { Input, PasswordInput, Button, DetailHeader } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { signupSchema, type SignupForm } from '../api/schemas';
import { getErrorMessage } from '@/shared/api/types';
import { Alert, Anchor, Box, Stack, Text, Title } from '@mantine/core';
import { PageContainer } from '@/shared/layouts/PageContainer';

interface SignupPageProps {
  onSignup?: () => void;
}

export default function Signup({ onSignup }: SignupPageProps) {
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (form: SignupForm) => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');

    setServerError('');

    try {
      await authApi.signup({ email: form.email, password: form.password });
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = await authApi.login({ email: form.email, password: form.password });

      login(data.access_token, data.refresh_token);

      onSignup?.();
      navigate('/auth/onboarding');
    } catch (err: unknown) {
      console.error(err);
      setServerError(getErrorMessage(err, t.auth.signupError));
    }
  };

  return (
    <PageContainer>
      <DetailHeader />
      <Box w="100%" maw={400} mx="auto" mt="sm">
        <Stack gap="md">
          <Title order={2}>{t.auth.signup}</Title>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="sm">
        <Input
          type="email"
          placeholder={t.auth.email}
          {...register('email')}
          error={errors.email?.message}
        />

        <PasswordInput
          placeholder={t.auth.passwordMin}
          {...register('password')}
          error={errors.password?.message}
        />

        <PasswordInput
          placeholder={t.auth.passwordConfirm}
          {...register('passwordConfirm')}
          error={errors.passwordConfirm?.message}
        />

              {serverError && (
                <Alert color="red" variant="light">
                  {serverError}
                </Alert>
              )}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          fullWidth
        >
          {isSubmitting ? t.auth.signingUp : t.auth.next}
        </Button>
            </Stack>
          </form>

          <Text size="sm" c="dimmed" ta="center">
            {t.auth.hasAccount}{' '}
            <Anchor component={Link} to="/auth/login" fw={600}>
              {t.auth.login}
            </Anchor>
          </Text>
        </Stack>
      </Box>
    </PageContainer>
  );
}
