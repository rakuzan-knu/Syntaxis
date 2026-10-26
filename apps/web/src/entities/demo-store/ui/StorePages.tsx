import { useState } from 'react';
import { ArrowLeft, Check, SearchX } from 'lucide-react';
import { useTimers } from '@/shared/lib';
import { formatPrice, defaultLine, addToCart, unitPrice, type StoreRoute } from '../model/store';
import { CartPage, CheckoutPage } from './CartPages';
import { Bean, Guide, PageTitle, StoreButton, TextLink, type StorePageProps } from './parts';

const ADDED_FEEDBACK = 1400;

type InnerRoute = Exclude<StoreRoute, { page: 'home' }>;

export default function StorePages({ route, ...props }: StorePageProps & { route: InnerRoute }) {
  switch (route.page) {
    case 'catalog':
      return <CatalogPage {...props} />;
    case 'product':
      return <ProductPage key={route.sku} sku={route.sku} {...props} />;
    case 'cart':
      return <CartPage {...props} />;
    case 'checkout':
      return <CheckoutPage {...props} />;
    case 'order':
      return <OrderPage id={route.id} {...props} />;
    case 'notFound':
      return <NotFoundPage path={route.path} {...props} />;
  }
}

function CatalogPage({ copy, accent, cart, hint, navigate, setCart }: StorePageProps) {
  return (
    <section className="px-5 py-6 @md:px-8 @md:py-8">
      <PageTitle>{copy.catalog.title}</PageTitle>
      <p className="mt-1.5 text-[0.8125rem] text-black/60">{copy.catalog.lead}</p>
      <ul className="mt-5 grid gap-3 @md:grid-cols-2">
        {copy.products.map((product, index) => (
          <li
            key={product.sku}
            className="flex gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
          >
            <button
              type="button"
              onClick={() => navigate(`/product/${product.sku}`)}
              aria-label={product.name}
              className="grid size-20 shrink-0 cursor-pointer place-items-center rounded-xl bg-[#efe7dc] transition-transform hover:scale-[1.03]"
            >
              <Bean sku={product.sku} className="size-12" />
            </button>
            <span className="flex min-w-0 flex-1 flex-col">
              <button
                type="button"
                onClick={() => navigate(`/product/${product.sku}`)}
                className="cursor-pointer truncate text-left text-[0.875rem] font-medium hover:underline"
              >
                {product.name}
              </button>
              <span className="truncate text-[0.75rem] text-black/60">{product.note}</span>
              <span className="relative mt-auto flex items-center justify-between gap-2 pt-3">
                <span className="text-[0.875rem] font-semibold tabular-nums">
                  {formatPrice(product.price, copy.currency)}
                </span>
                <StoreButton
                  accent={accent}
                  variant="outline"
                  onClick={() => setCart(addToCart(cart, defaultLine(product.sku)))}
                >
                  {copy.addToCart}
                </StoreButton>
                {index === 0 ? (
                  <Guide label={hint} side="top" className="top-1.5 -right-1.5" />
                ) : null}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OptionGroup({
  label,
  options,
  value,
  accent,
  onChange,
}: {
  label: string;
  options: StorePageProps['copy']['grinds'];
  value: string;
  accent: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-[0.75rem] text-black/60">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-[0.75rem] transition-colors ${active ? 'text-white' : 'border-black/15 bg-white hover:border-black/40'}`}
              style={active ? { backgroundColor: accent, borderColor: accent } : undefined}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ProductPage({
  sku,
  copy,
  accent,
  cart,
  hint,
  navigate,
  setCart,
}: StorePageProps & { sku: string }) {
  const product = copy.products.find((item) => item.sku === sku);
  const [grind, setGrind] = useState(copy.grinds[0]?.value ?? 'beans');
  const [weight, setWeight] = useState(copy.weights[0]?.value ?? '250');
  const [added, setAdded] = useState(false);
  const { schedule, clear } = useTimers();

  if (!product) return null;
  const line = { sku, grind, weight, quantity: 1 };

  const add = () => {
    setCart(addToCart(cart, line));
    setAdded(true);
    clear();
    schedule(() => setAdded(false), ADDED_FEEDBACK);
  };

  return (
    <section className="px-5 py-5 @md:px-8 @md:py-7">
      <button
        type="button"
        onClick={() => navigate('/catalog')}
        className="inline-flex cursor-pointer items-center gap-1 text-[0.75rem] text-black/60 hover:text-black"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        {copy.product.back}
      </button>
      <div className="mt-4 grid gap-5 @md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] @md:gap-8">
        <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-[#efe7dc] @md:aspect-square">
          <Bean sku={sku} className="size-28 @md:size-36" />
        </div>
        <div>
          <PageTitle>{product.name}</PageTitle>
          <p className="mt-1 text-[0.8125rem] text-black/60">{product.note}</p>
          <p className="mt-3 text-[0.8125rem] leading-relaxed">{product.description}</p>
          <p className="mt-3 text-[0.75rem] text-black/60">
            {copy.product.origin}: {product.origin}
          </p>
          <OptionGroup
            label={copy.product.grind}
            options={copy.grinds}
            value={grind}
            accent={accent}
            onChange={setGrind}
          />
          <OptionGroup
            label={copy.product.weight}
            options={copy.weights}
            value={weight}
            accent={accent}
            onChange={setWeight}
          />
          <div className="relative mt-5 flex items-center gap-4">
            <span className="text-[1.125rem] font-semibold tabular-nums">
              {formatPrice(unitPrice(line, copy.products), copy.currency)}
            </span>
            <span className="relative">
              <StoreButton accent={accent} onClick={add}>
                {added ? <Check aria-hidden="true" className="size-4" /> : null}
                {added ? copy.added : copy.addToCart}
              </StoreButton>
              <Guide label={hint} side="top" className="-top-1.5 -right-1.5" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderPage({ id, copy, accent, navigate }: StorePageProps & { id: string }) {
  return (
    <section className="grid min-h-80 place-items-center px-5 py-10 text-center">
      <div className="flex max-w-[28ch] flex-col items-center">
        <span
          className="ink-in grid size-14 place-items-center rounded-full text-white"
          style={{ backgroundColor: accent }}
        >
          <Check aria-hidden="true" className="size-7" strokeWidth={2.5} />
        </span>
        <PageTitle>
          <span className="mt-4 block">{copy.order.title}</span>
        </PageTitle>
        <p className="mt-2 text-[0.8125rem] text-black/60">
          {copy.order.number}: <span className="font-semibold text-black tabular-nums">№{id}</span>
        </p>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-black/60">{copy.order.text}</p>
        <StoreButton accent={accent} onClick={() => navigate('/')} className="mt-6">
          {copy.order.again}
        </StoreButton>
      </div>
    </section>
  );
}

function NotFoundPage({ path, copy, navigate }: StorePageProps & { path: string }) {
  return (
    <section className="grid min-h-80 place-items-center px-5 py-10 text-center">
      <div className="flex max-w-[30ch] flex-col items-center">
        <SearchX aria-hidden="true" className="size-10 text-black/30" strokeWidth={1.5} />
        <p className="mt-3 font-mono text-[0.75rem] text-black/40">404 · {path}</p>
        <PageTitle>
          <span className="mt-2 block">{copy.notFound.title}</span>
        </PageTitle>
        <p className="mt-2 text-[0.8125rem] text-black/60">{copy.notFound.text}</p>
        <div className="mt-5">
          <TextLink onClick={() => navigate('/')}>{copy.notFound.home}</TextLink>
        </div>
      </div>
    </section>
  );
}
