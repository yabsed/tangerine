import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from './store';
import { userApi } from '@/features/user/api/user';
import { useTranslation } from '@/shared/i18n';
import type { LoginForm } from '../api/schemas';
import { getErrorMessage } from '@/shared/api/types';

export function useLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: setAuth } = useAuth();
  const t = useTranslation();
  const [serverError, setServerError] = useState('');

  const redirect = searchParams.get('redirect') || '/products';

  const login = async (form: LoginForm) => {
    setServerError('');
    try {
      const data = await authApi.login(form);
      setAuth(data.access_token, data.refresh_token);

      const user = await userApi.getMe();
      const needsOnboarding = !user.nickname || !user.region;

      navigate(needsOnboarding
        ? `/auth/onboarding?redirect=${encodeURIComponent(redirect)}`
        : redirect
      );
    } catch (err) {
      setServerError(getErrorMessage(err, t.auth.invalidCredentials));
    }
  };

  return { login, serverError };
}
