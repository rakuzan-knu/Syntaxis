import { pagePath, type LegalSlug } from '@/shared/config';
import { LOCALES, useI18n, type Locale } from '@/shared/i18n';

const SHORT: Record<Locale, string> = { uk: 'UA', en: 'EN' };

const NATIVE: Record<Locale, string> = { uk: 'Українська', en: 'English' };

interface LocaleSwitchProps {
  className?: string;
  slug?: LegalSlug | undefined;
}

export function LocaleSwitch({ className = '', slug }: LocaleSwitchProps) {
  const { locale, t } = useI18n();
  return (
    <nav aria-label={t.header.localeLabel} className={className}>
      <ul className="flex items-center gap-3 text-step--1 font-medium">
        {LOCALES.map((item) => (
          <li key={item}>
            <a
              href={pagePath(item, slug)}
              hrefLang={item}
              lang={item}
              aria-label={`${SHORT[item]}, ${NATIVE[item]}`}
              aria-current={item === locale ? 'true' : undefined}
              className={`link-underline py-1 ${item === locale ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {SHORT[item]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
