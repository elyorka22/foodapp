import { uz, type TranslationDict } from './uz';

export type Locale = 'uz';

const dictionaries: Record<Locale, TranslationDict> = { uz };

let currentLocale: Locale = 'uz';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

/** Translate key with optional `{param}` interpolation */
export function t(key: string, params?: Record<string, string | number>): string {
  const raw = getNested(dictionaries[currentLocale] as unknown as Record<string, unknown>, key) ?? key;
  if (!params) return raw;
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    raw,
  );
}

export function useTranslations() {
  return { t, locale: currentLocale };
}

/** Order status label for panels and tracking */
export function orderStatus(status: string): string {
  const key = `orderStatus.${status}`;
  const label = t(key);
  return label === key ? t(`orders.status.${status}`) : label;
}

export { uz };
