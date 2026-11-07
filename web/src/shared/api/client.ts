import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { MAIN_API_URL } from './config';
import { useAuthStore } from '@/features/auth/hooks/store';

const client: AxiosInstance = axios.create({
  baseURL: MAIN_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

client.interceptors.request.use((config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
  // Zustand store에서 토큰 조회 (Single Source of Truth)
  const token = useAuthStore.getState().token;

  // ✅ 수정된 부분: token이 있고, config에 skipAuth가 true가 아닐 때만 헤더 주입
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 에러 중앙 처리 및 토큰 자동 갱신
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // 로그인/refresh 요청이나 상품 목록 요청은 401이어도 리다이렉션하지 않음
      if (originalRequest.url?.includes('/api/auth/tokens') || originalRequest.url?.includes('/api/product')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 이미 갱신 중이면 대기열에 추가
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, updateTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // refresh token으로 새 토큰 발급
        const response = await axios.get(`${MAIN_API_URL}/api/auth/tokens/refresh`, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const { access_token, refresh_token } = response.data;
        // Zustand store 업데이트 (localStorage도 함께 동기화)
        updateTokens(access_token, refresh_token);

        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // 토큰 갱신 실패 시 로그아웃 처리
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
