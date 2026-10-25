import { useMemo, type ReactNode } from 'react';
import type { Dictionary, Locale } from './types';
import { I18nContext, type I18nValue } from './context';

interface I18nProviderProps {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}

export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  const value = useMemo<I18nValue>(() => ({ locale, t: dictionary }), [locale, dictionary]);
  return <I18nContext value={value}>{children}</I18nContext>;
}
