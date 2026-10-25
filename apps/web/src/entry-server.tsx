import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from '@/app/App';
import { PRERENDER_ROUTES, resolveRoute } from '@/app/routes';
import { getDictionary, getLegal } from '@/shared/i18n/server';

export { buildHead, buildRobots, buildSecurityTxt, buildSitemap } from '@/shared/config/seo';

export const prerenderRoutes = PRERENDER_ROUTES;

export async function render(url: string): Promise<string> {
  const route = resolveRoute(url);
  return renderToString(
    <StrictMode>
      <App
        path={url}
        dictionary={getDictionary(route.locale)}
        legal={route.page === 'legal' ? getLegal(route.locale) : undefined}
      />
    </StrictMode>,
  );
}
