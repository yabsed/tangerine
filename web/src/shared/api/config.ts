export const MAIN_API_URL = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');

export function chatSocketUrl(roomId: string): string {
  const url = new URL(`/api/chat/ws/${encodeURIComponent(roomId)}`, MAIN_API_URL || window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
