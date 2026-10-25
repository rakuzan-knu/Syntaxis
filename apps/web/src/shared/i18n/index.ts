export type {
  Choice,
  Correction,
  DemoProduct,
  Dictionary,
  FaqItem,
  GlossaryItem,
  LegalBlock,
  LegalDocument,
  LegalDocuments,
  LegalSection,
  Locale,
  ProcessStep,
  SectionCopy,
  ServiceItem,
} from './types';
export { DEFAULT_LOCALE, LOCALES, loadDictionary, loadLegal, localePath } from './locales';
export { I18nProvider } from './I18nProvider';
export { useI18n } from './useI18n';
