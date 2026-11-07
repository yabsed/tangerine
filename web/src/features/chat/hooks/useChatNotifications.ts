import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/hooks/store';
import { chatSocketUrl } from '@/shared/api/config';
import client from '@/shared/api/client';
import { chatKeys } from './useChat';
import { userKeys } from '@/features/user/hooks/useUser';
import { transactionKeys } from '@/features/pay/hooks/useTransactions';

export function useChatNotifications(enabled: boolean) {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (!enabled || !token) return;

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

        socket = new WebSocket(chatSocketUrl());
        socket.onopen = () => {
          socket?.send(JSON.stringify({ token: useAuthStore.getState().token }));
        };
        socket.onmessage = event => {
          if (stopped) return;
          const { type, room_id: roomId } = JSON.parse(event.data);
          attempt = 0;

          // Reconnects fetch the current state, including events missed offline.
          if (type === 'ready' || type === 'transfer') {
            void queryClient.invalidateQueries({ queryKey: userKeys.me() });
            void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
          }

          if (type === 'ready') {
            void queryClient.invalidateQueries({ queryKey: chatKeys.all });
          } else if (type === 'message' || type === 'read') {
            void queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
            void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
          }
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
  }, [enabled, token, queryClient]);
}
