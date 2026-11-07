import client from '@/shared/api/client';
import type {
  UserResponse,
  UserOnboardingRequest,
  UserUpdateRequest,
  PublicUserResponse,
} from '@/shared/api/types';

export const userApi = {
  getMe: async (): Promise<UserResponse> => {
    const response = await client.get<UserResponse>('/api/user/me');
    return response.data;
  },

  onboardMe: async (data: UserOnboardingRequest): Promise<UserResponse> => {
    const response = await client.post<UserResponse>('/api/user/me/onboard', data);
    return response.data;
  },

  patchMe: async (data: UserUpdateRequest): Promise<UserResponse> => {
    const response = await client.patch<UserResponse>('/api/user/me', data);
    return response.data;
  },

  getUser: async (userId: string): Promise<PublicUserResponse> => {
    const response = await client.get<PublicUserResponse>(`/api/user/${userId}`);
    return response.data;
  },
};

// Re-export types for backward compatibility
export type {
  UserResponse,
  UserOnboardingRequest,
  UserUpdateRequest,
  PublicUserResponse,
} from '@/shared/api/types';

// Alias for backward compatibility
export type User = UserResponse;
export type OnboardingParams = UserOnboardingRequest;
export type PatchUserParams = UserUpdateRequest;
export type PublicUserProfile = PublicUserResponse;
