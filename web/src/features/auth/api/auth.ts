import client from '@/shared/api/client';
import { SOCIAL_LOGIN_API_URL } from '@/features/auth/api/config';
import type {
  UserSigninRequest,
  UserSignupRequest,
  TokenResponse,
  UserResponse,
} from '@/shared/api/types';

export const authApi = {
  signup: async (data: UserSignupRequest): Promise<UserResponse> => {
    const response = await client.post<UserResponse>('/api/user/', data);
    return response.data;
  },

  login: async (data: UserSigninRequest): Promise<TokenResponse> => {
    const response = await client.post<TokenResponse>('/api/auth/tokens', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await client.delete('/api/auth/tokens');
  },

  getGoogleLoginUrl: (): string => `${SOCIAL_LOGIN_API_URL}/api/auth/oauth2/login/google`,
};
