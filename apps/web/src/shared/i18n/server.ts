import { en } from './dictionaries/en';
import { uk } from './dictionaries/uk';
import { legalEn } from './legal/legal-en';
import { legalUk } from './legal/legal-uk';
import type { Dictionary, LegalDocuments, Locale } from './types';

const DICTIONARIES: Record<Locale, Dictionary> = { uk, en };

const LEGAL: Record<Locale, LegalDocuments> = { uk: legalUk, en: legalEn };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export function getLegal(locale: Locale): LegalDocuments {
  return LEGAL[locale];
}
