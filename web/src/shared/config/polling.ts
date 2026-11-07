export const POLLING_CONFIG = {
  USER_BALANCE: 50_000,     // 마이감귤 잔액 (50초)

  // 캐시 유효 시간. 채팅 갱신은 웹소켓 알림으로 처리한다.
  STALE_TIME: {
    CHAT_ROOMS: 60_000,    // 채팅방 목록 (1분)
    CHAT_MESSAGES: 30_000, // 채팅 메시지 (30초)
  },
} as const;
