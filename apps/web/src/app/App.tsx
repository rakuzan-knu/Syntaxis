import { HomePage } from '@/pages/home';
import { LegalPage } from '@/pages/legal';
import type { Dictionary, LegalDocuments } from '@/shared/i18n';
import { NotFoundPage } from '@/pages/not-found';
import { LocaleLayout } from './providers/LocaleLayout';
import { resolveRoute } from './routes';

interface AppProps {
  path: string;
  dictionary: Dictionary;
  legal?: LegalDocuments | undefined;
}

export function App({ path, dictionary, legal }: AppProps) {
  const route = resolveRoute(path);
  return (
    <LocaleLayout locale={route.locale} dictionary={dictionary}>
      {route.page === 'home' ? (
        <HomePage />
      ) : route.page === 'legal' && legal ? (
        <LegalPage slug={route.slug} document={legal[route.slug]} />
      ) : (
        <NotFoundPage />
      )}
    </LocaleLayout>
  );
}
