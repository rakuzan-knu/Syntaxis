import { Suspense, lazy } from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  formatPrice,
  defaultLine,
  addToCart,
  cartTotals,
  parseStorePath,
  type CartLine,
} from '../model/store';
import { Bean, Guide, StoreButton, type StoreCopy, type StorePageProps } from './parts';

const StorePages = lazy(() => import('./StorePages'));

const NAV_PATHS = ['/catalog', '/product/ethiopia', '/cart'] as const;
const EMPTY_CART: readonly CartLine[] = [];
const noop = () => undefined;

interface DemoStoreProps {
  copy: StoreCopy;
  headline: string;
  cta: string;
  accent: string;
  path?: string;
  cart?: readonly CartLine[];
  guide?: boolean;
  onNavigate?: (path: string) => void;
  onCart?: (cart: CartLine[]) => void;
}

function guideFor(page: string, count: number, copy: StoreCopy['guide']) {
  if (page === 'order' || page === 'notFound') return { target: null, label: null };
  if (page === 'checkout') return { target: 'place', label: copy.place };
  if (page === 'cart')
    return count > 0 ? { target: 'checkout', label: copy.checkout } : { target: null, label: null };
  if (count === 0) return { target: 'add', label: copy.add };
  return { target: 'open', label: copy.open };
}

export function DemoStore({
  copy,
  headline,
  cta,
  accent,
  path = '/',
  cart = EMPTY_CART,
  guide = false,
  onNavigate = noop,
  onCart = noop,
}: DemoStoreProps) {
  const route = parseStorePath(
    path,
    copy.products.map((product) => product.sku),
  );
  const { count } = cartTotals(cart, copy.products);
  const step = guide ? guideFor(route.page, count, copy.guide) : { target: null, label: null };
  const pageProps: StorePageProps = {
    copy,
    accent,
    cart,
    hint: step.target === 'open' ? null : step.label,
    navigate: onNavigate,
    setCart: onCart,
  };

  return (
    <div className="@container min-h-full bg-[#f7f4ef] font-sans text-[#1d1a17]">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/10 bg-[#f7f4ef]/95 px-5 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="cursor-pointer font-semibold tracking-[-0.02em]"
        >
          {copy.brand}
        </button>
        <nav aria-label={copy.brand} className="hidden gap-5 text-[0.8125rem] @md:flex">
          {copy.nav.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => onNavigate(NAV_PATHS[index] ?? '/')}
              className="cursor-pointer text-black/60 transition-colors hover:text-black"
            >
              {item}
            </button>
          ))}
        </nav>
        <button
          type="button"
          data-guide="cart"
          onClick={() => onNavigate('/cart')}
          aria-label={`${copy.cartLabel}: ${count}`}
          className="relative -m-1.5 grid size-8 cursor-pointer place-items-center rounded-full hover:bg-black/5"
        >
          <ShoppingBag aria-hidden="true" className="size-5" />
          {count > 0 ? (
            <span
              key={count}
              aria-hidden="true"
              className="ink-in absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full text-[0.625rem] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {count}
            </span>
          ) : null}
          <Guide
            label={step.target === 'open' ? step.label : null}
            side="left"
            className="top-2.5 -left-3"
          />
        </button>
      </header>

      {route.page === 'home' ? (
        <StoreHome {...pageProps} headline={headline} cta={cta} />
      ) : (
        <Suspense fallback={<div className="min-h-64" />}>
          <StorePages route={route} {...pageProps} />
        </Suspense>
      )}
    </div>
  );
}

function StoreHome({
  copy,
  accent,
  cart,
  hint,
  navigate,
  setCart,
  headline,
  cta,
}: StorePageProps & { headline: string; cta: string }) {
  return (
    <>
      <section className="px-5 pt-8 pb-6 @md:px-8 @md:pt-12">
        <p className="max-w-[14ch] text-[1.75rem] leading-[1.05] font-semibold tracking-[-0.03em] break-words @md:text-[2.5rem]">
          {headline || ' '}
        </p>
        <p className="mt-3 max-w-[34ch] text-[0.875rem] text-black/60">{copy.sub}</p>
        <StoreButton accent={accent} onClick={() => navigate('/catalog')} className="mt-5">
          {cta || ' '}
        </StoreButton>
      </section>

      <ul className="grid gap-3 px-5 pb-6 @md:grid-cols-3 @md:px-8">
        {copy.products.map((product, index) => (
          <li
            key={product.sku}
            className="relative flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-shadow hover:shadow-[0_4px_16px_rgb(0_0_0/0.08)] @md:flex-col @md:items-start"
          >
            <button
              type="button"
              onClick={() => navigate(`/product/${product.sku}`)}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left @md:w-full @md:flex-col @md:items-start"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#efe7dc]">
                <Bean sku={product.sku} />
              </span>
              <span className="min-w-0 flex-1 @md:w-full">
                <span className="block truncate text-[0.8125rem] font-medium">{product.name}</span>
                <span className="block truncate text-[0.75rem] text-black/60">{product.note}</span>
              </span>
            </button>
            <span className="relative flex shrink-0 flex-col items-end gap-1.5 @sm:flex-row @sm:items-center @sm:gap-2 @md:w-full @md:justify-between">
              <span className="text-[0.8125rem] font-semibold tabular-nums">
                {formatPrice(product.price, copy.currency)}
              </span>
              <span className="relative flex">
                <StoreButton
                  accent={accent}
                  variant="outline"
                  guide={index === 0 ? 'add-to-cart' : undefined}
                  onClick={() => setCart(addToCart(cart, defaultLine(product.sku)))}
                >
                  {copy.addToCart}
                </StoreButton>
                {index === 0 ? (
                  <Guide label={hint} side="top" className="-top-1.5 -right-1.5" />
                ) : null}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
