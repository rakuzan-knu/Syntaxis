import type { Dictionary, LegalDocuments, Locale } from './types';

export const LOCALES: readonly Locale[] = ['uk', 'en'];

export const DEFAULT_LOCALE: Locale = 'uk';

const LOADERS: Record<Locale, () => Promise<Dictionary>> = {
  uk: () => import('./dictionaries/uk').then((module) => module.uk),
  en: () => import('./dictionaries/en').then((module) => module.en),
};

export function loadDictionary(locale: Locale): Promise<Dictionary> {
  return LOADERS[locale]();
}

const LEGAL_LOADERS: Record<Locale, () => Promise<LegalDocuments>> = {
  uk: () => import('./legal/legal-uk').then((module) => module.legalUk),
  en: () => import('./legal/legal-en').then((module) => module.legalEn),
};

export function loadLegal(locale: Locale): Promise<LegalDocuments> {
  return LEGAL_LOADERS[locale]();
}

export function localePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}`;
}
