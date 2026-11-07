export const formatPrice = (price: number, currencySuffix: string) =>
  `${price.toLocaleString()}${currencySuffix}`;

// 상대 시간 표시 (예: "방금 전", "5분 전", "3일 전")
export type RelativeTimeLabels = {
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
};

export function formatRelativeTime(
  dateString: string | null | undefined,
  labels: RelativeTimeLabels
): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return labels.justNow;
  if (diffMins < 60) return `${diffMins}${labels.minutesAgo}`;
  if (diffHours < 24) return `${diffHours}${labels.hoursAgo}`;
  if (diffDays < 7) return `${diffDays}${labels.daysAgo}`;
  return date.toLocaleDateString();
}

// 메시지 시간 표시 (예: "오후 3:45")
export function formatMessageTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// 날짜+시간 표시 (예: "2024년 1월 15일 오후 3:45")
export function formatDateTime(dateStr: string, locale: string): string {
  // 서버에서 Z 없이 UTC 시간으로 오는 경우 처리
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const date = new Date(normalized);
  return date.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type TimeLabels = {
  timeEnded: string;
  days: string;
  hours: string;
  minutes: string;
  seconds?: string;
  remaining?: string;
};

export function formatRemainingTime(endAt: string, t: TimeLabels): string {
  // 서버에서 Z 없이 UTC 시간으로 오는 경우 처리
  const normalized = endAt.endsWith('Z') || endAt.includes('+') ? endAt : endAt + 'Z';
  const diff = new Date(normalized).getTime() - Date.now();
  if (diff <= 0) return t.timeEnded;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const suffix = t.remaining ? ` ${t.remaining}` : '';
  const tail = t.seconds ? ` ${s}${t.seconds}` : suffix;

  if (d > 0) return `${d}${t.days} ${h}${t.hours}${suffix}`;
  if (h > 0) return `${h}${t.hours} ${m}${t.minutes}${tail}`;
  return `${m}${t.minutes}${tail}`;
}
