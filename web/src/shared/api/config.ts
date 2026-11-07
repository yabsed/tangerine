export const MAIN_API_URL = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');

export function chatSocketUrl(): string {
  const url = new URL('/api/chat/ws', MAIN_API_URL || window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
