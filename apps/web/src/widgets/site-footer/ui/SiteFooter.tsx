import { LocaleSwitch } from '@/features/switch-locale';
import {
  BRAND,
  COPYRIGHT_YEAR,
  LEGAL_SLUGS,
  TELEGRAM_HANDLE,
  legalPath,
  type LegalSlug,
} from '@/shared/config';
import { localePath, useI18n } from '@/shared/i18n';
import { telegramLink } from '@/shared/lib';
import { Logo } from '@/shared/ui';

interface FooterLink {
  href: string;
  label: string;
}

interface FooterColumnProps {
  id: string;
  title: string;
  links: readonly FooterLink[];
}

function FooterColumn({ id, title, links }: FooterColumnProps) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="text-step--1 font-semibold">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5 text-step--1">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="link-underline py-0.5 text-muted hover:text-ink">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter({ slug }: { slug?: LegalSlug | undefined }) {
  const { t, locale } = useI18n();
  const home = localePath(locale);
  const services = t.services.items.map((item) => ({
    href: `${home}#service-${item.id}`,
    label: item.title,
  }));
  const company = [
    { href: `${home}#work`, label: t.nav.work },
    { href: `${home}#terms`, label: t.nav.terms },
    { href: `${home}#process`, label: t.nav.process },
    { href: `${home}#brief`, label: t.nav.brief },
    { href: `${home}#faq`, label: t.nav.faq },
  ];

  return (
    <footer className="overflow-hidden border-t border-line">
      <div className="mx-auto max-w-[76rem] px-gutter pt-14 md:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <a href={home} aria-label={t.header.home} className="inline-flex">
              <Logo />
            </a>
            <p className="mt-4 max-w-[22rem] text-step--1 text-muted">{t.footer.tagline}</p>
            <p className="mt-8 text-step--1 font-semibold">{t.footer.languageLabel}</p>
            <LocaleSwitch slug={slug} className="mt-2" />
          </div>
          <FooterColumn id="footer-services" title={t.footer.servicesLabel} links={services} />
          <FooterColumn id="footer-company" title={t.footer.companyLabel} links={company} />
          <div>
            <h2 className="text-step--1 font-semibold">{t.footer.contactLabel}</h2>
            <address className="mt-4 space-y-2.5 text-step--1 not-italic">
              <p>
                <a
                  href={telegramLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline py-0.5 font-medium text-accent"
                >
                  {t.footer.telegram}: @{TELEGRAM_HANDLE}
                </a>
              </p>
              <p className="text-muted">{t.footer.response}</p>
              <p className="text-muted">{t.footer.location}</p>
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-step--1 text-faint">
            © {COPYRIGHT_YEAR} {BRAND}. {t.footer.rights}
          </p>
          <nav aria-label={t.footer.legalLabel}>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-step--1">
              {LEGAL_SLUGS.map((item) => (
                <li key={item}>
                  <a
                    href={legalPath(locale, item)}
                    aria-current={item === slug ? 'page' : undefined}
                    className={`link-underline py-0.5 ${item === slug ? 'text-ink' : 'text-faint hover:text-ink'}`}
                  >
                    {t.legal.titles[item]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1000 170"
        className="mx-auto block w-full max-w-[76rem] px-gutter text-ink/[0.06] select-none"
      >
        <text
          x="0"
          y="200"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
          fontSize="250"
          fontWeight="600"
          fill="currentColor"
        >
          {BRAND}
        </text>
      </svg>
    </footer>
  );
}
