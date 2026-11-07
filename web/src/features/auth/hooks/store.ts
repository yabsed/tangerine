import { create } from 'zustand';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  updateTokens: (token: string, refreshToken: string) => void;
}

// localStorage 안전하게 접근 (Safari Private Mode 등에서 실패 가능)
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Safari Private Mode 등에서 실패 시 무시 (메모리에는 저장됨)
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 실패 시 무시
  }
}

// 초기화: localStorage에서 토큰을 읽어 Zustand store 초기화
const initialToken = safeGetItem('token');
const initialRefreshToken = safeGetItem('refresh_token');

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  refreshToken: initialRefreshToken,
  isLoggedIn: !!initialToken,

  login: (token, refreshToken) => {
    safeSetItem('token', token);
    safeSetItem('refresh_token', refreshToken);
    set({ token, refreshToken, isLoggedIn: true });
  },

  logout: () => {
    safeRemoveItem('token');
    safeRemoveItem('refresh_token');
    set({ token: null, refreshToken: null, isLoggedIn: false });
  },

  // 토큰 갱신용 (client.ts의 interceptor에서 사용)
  updateTokens: (token, refreshToken) => {
    safeSetItem('token', token);
    safeSetItem('refresh_token', refreshToken);
    set({ token, refreshToken });
  },
}));

// 인증 상태 selector (최적화된 구독)
export const useIsLoggedIn = () => useAuthStore((state) => state.isLoggedIn);
export const useToken = () => useAuthStore((state) => state.token);

// 컴포넌트에서 사용하는 훅 (기존 API 호환)
export function useAuth() {
  const { login, logout } = useAuthStore();
  return { login, logout };
}
