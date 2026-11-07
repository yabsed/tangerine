import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useIsLoggedIn } from './store';
import { userKeys } from '@/features/user/hooks/useUser';

// Effect 기반 React Query 캐시 동기화 훅
export function useAuthQuerySync() {
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLoggedIn();
  const prevIsLoggedIn = useRef(isLoggedIn);

  useEffect(() => {
    // 로그인 상태가 변경되었을 때만 처리
    if (prevIsLoggedIn.current !== isLoggedIn) {
      if (isLoggedIn) {
        // 로그인: 사용자 데이터 새로고침
        queryClient.invalidateQueries({ queryKey: userKeys.me() });
      } else {
        // 로그아웃: 모든 쿼리 캐시 제거
        queryClient.removeQueries();
      }
      prevIsLoggedIn.current = isLoggedIn;
    }
  }, [isLoggedIn, queryClient]);
}
