import { useEffect, type ReactNode } from 'react';
import { I18nProvider, type Dictionary, type Locale } from '@/shared/i18n';

interface LocaleLayoutProps {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}

export function LocaleLayout({ locale, dictionary, children }: LocaleLayoutProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      {children}
    </I18nProvider>
  );
}
