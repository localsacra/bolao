import type { Language } from '../i18n';

export function formatMatchDate(utcDate: string, lang: Language = 'pt'): string {
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeZoneName: 'short'
  }).format(new Date(utcDate))
}
