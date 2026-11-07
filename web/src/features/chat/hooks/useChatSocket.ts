import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/hooks/store';
import { chatSocketUrl } from '@/shared/api/config';
import client from '@/shared/api/client';
import { chatKeys } from './useChat';

export function useChatSocket(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (!roomId || !token) return;

    let stopped = false;
    let attempt = 0;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;

    function retry() {
      if (stopped) return;
      const delay = Math.min(1000 * 2 ** attempt++, 30000);
      timer = setTimeout(connect, delay + Math.random() * 500);
    }

    async function connect() {
      try {
        // The HTTP client refreshes expired access tokens before reconnecting.
        await client.get('/api/user/me');
        if (stopped) return;

        socket = new WebSocket(chatSocketUrl(roomId!));
        socket.onopen = () => {
          socket?.send(JSON.stringify({ token: useAuthStore.getState().token }));
        };
        socket.onmessage = () => {
          attempt = 0;
          // Both "ready" and messages trigger HTTP replay, including missed messages.
          void queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId!) });
          void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
        };
        socket.onclose = event => {
          if (event.code !== 4003) retry();
        };
      } catch {
        retry();
      }
    }

    void connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
    };
  }, [roomId, token, queryClient]);
}
