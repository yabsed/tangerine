import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { authApi } from '@/features/auth/api/auth';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { Input, PasswordInput, Button, GoogleIcon } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginForm } from '../api/schemas';
import { Alert, Anchor, Box, Flex, Stack, Text, Title } from '@mantine/core';

export default function Login() {
  const { login, serverError } = useLogin();
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <PageContainer>
      <Box w="100%" maw={400} mx="auto" mt={40}>
        <Stack gap="md">
          <Title order={2}>{t.auth.login}</Title>

        <form onSubmit={handleSubmit(login)}>
          <Stack gap="sm">
            <Flex gap="sm" align="stretch">
              <Stack gap="sm" style={{ flex: 1 }}>
                <Input
                  type="email"
                  placeholder={t.auth.email}
                  {...register('email')}
                  error={errors.email?.message}
                />

                <PasswordInput
                  placeholder={t.auth.password}
                  {...register('password')}
                  error={errors.password?.message}
                />
              </Stack>

              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                variant="primary"
                h="auto"
                style={{ aspectRatio: '1/1' }}
              >
                {!isSubmitting &&  t.auth.login}
              </Button>
            </Flex>

            {serverError && (
              <Alert color="red" variant="light">
                {serverError}
              </Alert>
            )}
          </Stack>
        </form>

        <Button
          onClick={() => (window.location.href = authApi.getGoogleLoginUrl())}
          variant="outline"
          fullWidth
          leftSection={<GoogleIcon />}
        >
          {t.auth.continueWithGoogle}
        </Button>

        <Text size="sm" c="dimmed" ta="center">
          {t.auth.noAccount}{' '}
          <Anchor component={Link} to="/auth/signup" fw={600}>
            {t.auth.signup}
          </Anchor>
        </Text>
      </Stack>
    </Box>
    </PageContainer>
  );
}
