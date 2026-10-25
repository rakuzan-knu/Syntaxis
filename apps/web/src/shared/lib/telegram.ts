import { TELEGRAM_URL } from '@/shared/config/site';

export function telegramLink(text?: string): string {
  if (!text) return TELEGRAM_URL;
  return `${TELEGRAM_URL}?text=${encodeURIComponent(text)}`;
}
