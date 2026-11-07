/**
 * 전역 폴링 설정
 * 채팅, 결제 등 실시간성이 필요한 기능의 polling interval을 한 곳에서 관리
 */

export const POLLING_CONFIG = {
  // 채팅 관련
  CHAT_ROOMS: 60_000,      // 채팅방 목록 (60초)
  UNREAD_COUNT: 60_000,    // 읽지 않은 메시지 수 (60초)

  // 결제/송금 관련
  USER_BALANCE: 50_000,     // 잔액 (50초)
  TRANSACTIONS: 50_000,     // 거래 내역 (50초)

  // 채팅방 페이지 전용 (5초)
  CHAT_ROOM_PAGE: 7_000,    // 채팅방 페이지에서 메시지, 잔액, 송금 폴링

  // staleTime 설정
  STALE_TIME: {
    CHAT_ROOMS: 60_000,    // 채팅방 목록 (1분)
    CHAT_MESSAGES: 30_000, // 채팅 메시지 (30초)
  },
} as const;

// 개발/디버깅용: 모든 폴링을 비활성화하려면 이 값을 true로 설정
export const DISABLE_ALL_POLLING = false;

// Helper: 폴링 interval 반환 (비활성화 시 false 반환)
export function getPollingInterval(interval: number, enabled: boolean = true): number | false {
  if (DISABLE_ALL_POLLING || !enabled) return false;
  return interval;
}
