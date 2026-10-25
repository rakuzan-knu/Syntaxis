import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { isSameRoute, resolveRoute } from '@/app/routes';
import { loadDictionary, loadLegal } from '@/shared/i18n';
import '@/app/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container is missing');

const path = window.location.pathname;
const prerendered = container.dataset.route;
const route = resolveRoute(path);

const [dictionary, legal] = await Promise.all([
  loadDictionary(route.locale),
  route.page === 'legal' ? loadLegal(route.locale) : undefined,
]);

const app = (
  <StrictMode>
    <App path={path} dictionary={dictionary} legal={legal} />
  </StrictMode>
);

if (prerendered !== undefined && isSameRoute(prerendered, path)) {
  hydrateRoot(container, app);
} else {
  container.replaceChildren();
  createRoot(container).render(app);
}
