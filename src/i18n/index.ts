import { pt } from './pt';
import { en } from './en';

export type Language = 'pt' | 'en';
export type Translations = typeof pt;

export const translations = { pt, en };

export function t(lang: Language, path: string): string {
  const keys = path.split('.');
  let obj: any = translations[lang];
  for (const key of keys) {
    obj = obj?.[key];
  }
  return obj ?? path;
}
