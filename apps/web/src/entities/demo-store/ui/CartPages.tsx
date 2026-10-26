import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useTimers } from '@/shared/lib';
import {
  formatPrice,
  FREE_DELIVERY_FROM,
  MAX_QUANTITY,
  cartTotals,
  lineKey,
  orderNumber,
  setQuantity,
  unitPrice,
} from '../model/store';
import { Bean, Guide, PageTitle, StoreButton, type StorePageProps } from './parts';

const PLACING_DELAY = 900;

function labelOf(options: StorePageProps['copy']['grinds'], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function Summary({
  copy,
  cart,
  action,
}: Pick<StorePageProps, 'copy' | 'cart'> & { action: ReactNode }) {
  const totals = cartTotals(cart, copy.products);
  const price = (value: number) => formatPrice(value, copy.currency);
  return (
    <div className="text-[0.8125rem]">
      <dl className="grid grid-cols-[1fr_auto] gap-y-1">
        <dt className="text-black/60">{copy.cart.subtotal}</dt>
        <dd className="text-right tabular-nums">{price(totals.subtotal)}</dd>
        <dt className="text-black/60">{copy.cart.delivery}</dt>
        <dd className="text-right tabular-nums">
          {totals.delivery === 0 ? copy.cart.free : price(totals.delivery)}
        </dd>
      </dl>
      <div className="mt-2.5 border-t border-black/10 pt-2.5 @xs:flex @xs:items-center @xs:gap-3 @2xl:block">
        <dl className="flex flex-1 items-baseline justify-between gap-2 font-semibold @xs:justify-start @2xl:justify-between">
          <dt>{copy.cart.total}</dt>
          <dd className="whitespace-nowrap tabular-nums">{price(totals.total)}</dd>
        </dl>
        <div className="relative mt-3 @xs:mt-0 @xs:shrink-0 @2xl:mt-4 [&>button]:w-full @xs:[&>button]:w-auto @2xl:[&>button]:w-full">
          {action}
        </div>
      </div>
    </div>
  );
}

export function CartPage({ copy, accent, cart, hint, navigate, setCart }: StorePageProps) {
  const totals = cartTotals(cart, copy.products);
  const progress = Math.min(totals.subtotal / FREE_DELIVERY_FROM, 1);

  if (cart.length === 0) {
    return (
      <section className="grid min-h-80 place-items-center px-5 py-10 text-center">
        <div className="flex max-w-[28ch] flex-col items-center">
          <ShoppingBag aria-hidden="true" className="size-10 text-black/30" strokeWidth={1.5} />
          <PageTitle>
            <span className="mt-3 block">{copy.cart.title}</span>
          </PageTitle>
          <p className="mt-2 text-[0.8125rem] text-black/60">{copy.cart.empty}</p>
          <StoreButton accent={accent} onClick={() => navigate('/catalog')} className="mt-5">
            {copy.cart.browse}
          </StoreButton>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-4 @md:px-8 @md:py-8">
      <PageTitle>{copy.cart.title}</PageTitle>
      <div className="mt-3 grid grid-cols-1 gap-3 @2xl:mt-5 @2xl:grid-cols-[minmax(0,1fr)_16rem] @2xl:gap-5">
        <ul className="divide-y divide-black/10 rounded-2xl bg-white px-4 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
          {cart.map((line) => {
            const product = copy.products.find((item) => item.sku === line.sku);
            const key = lineKey(line);
            return (
              <li key={key} className="flex items-center gap-3 py-2 @sm:py-2.5">
                <button
                  type="button"
                  onClick={() => navigate(`/product/${line.sku}`)}
                  aria-label={product?.name ?? line.sku}
                  className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-lg bg-[#efe7dc]"
                >
                  <Bean sku={line.sku} className="size-8" />
                </button>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="line-clamp-2 text-[0.8125rem] font-medium break-words">
                    {product?.name}
                  </span>
                  <span className="block truncate text-[0.6875rem] text-black/60">
                    {labelOf(copy.grinds, line.grind)}, {labelOf(copy.weights, line.weight)}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] font-semibold tabular-nums @sm:hidden">
                    {formatPrice(unitPrice(line, copy.products) * line.quantity, copy.currency)}
                  </span>
                </span>
                <span
                  role="group"
                  aria-label={copy.cart.quantity}
                  className="flex shrink-0 items-center rounded-full border border-black/15"
                >
                  <button
                    type="button"
                    aria-label={line.quantity === 1 ? copy.cart.remove : '−1'}
                    onClick={() => setCart(setQuantity(cart, key, line.quantity - 1))}
                    className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-black/5"
                  >
                    <Minus
                      aria-hidden="true"
                      className={`size-3 ${line.quantity === 1 ? 'hidden @sm:block' : ''}`}
                    />
                    {line.quantity === 1 ? (
                      <Trash2 aria-hidden="true" className="size-3 @sm:hidden" />
                    ) : null}
                  </button>
                  <span className="w-5 text-center text-[0.75rem] tabular-nums" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="+1"
                    disabled={line.quantity >= MAX_QUANTITY}
                    onClick={() => setCart(setQuantity(cart, key, line.quantity + 1))}
                    className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus aria-hidden="true" className="size-3" />
                  </button>
                </span>
                <span className="hidden w-16 text-right text-[0.8125rem] font-semibold tabular-nums @sm:block">
                  {formatPrice(unitPrice(line, copy.products) * line.quantity, copy.currency)}
                </span>
                <button
                  type="button"
                  aria-label={`${copy.cart.remove}: ${product?.name ?? ''}`}
                  title={copy.cart.remove}
                  onClick={() => setCart(setQuantity(cart, key, 0))}
                  className="hidden size-7 shrink-0 cursor-pointer place-items-center rounded-full text-black/40 hover:bg-black/5 hover:text-black @sm:grid"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="self-start rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
          <div className="mb-2.5 flex items-center gap-3 @2xl:mb-4 @2xl:flex-col @2xl:items-stretch @2xl:gap-1.5">
            <p className="shrink-0 text-[0.6875rem] text-black/60">{copy.cart.freeFrom}</p>
            <span className="block h-1 flex-1 overflow-hidden rounded-full bg-black/10 @2xl:flex-none">
              <span
                className="block h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progress * 100}%`, backgroundColor: accent }}
              />
            </span>
          </div>
          <Summary
            copy={copy}
            cart={cart}
            action={
              <>
                <StoreButton accent={accent} guide="checkout" onClick={() => navigate('/checkout')}>
                  {copy.cart.checkout}
                </StoreButton>
                <Guide label={hint} side="top" className="-top-1.5 -right-1.5" />
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}

const FIELD =
  'mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-[0.8125rem] outline-none transition-colors focus:border-black/50';

export function CheckoutPage({ copy, accent, cart, hint, navigate, setCart }: StorePageProps) {
  const id = useId();
  const [name, setName] = useState('');
  const [city, setCity] = useState(copy.checkout.cities[0]?.value ?? '');
  const [payment, setPayment] = useState(copy.checkout.payments[0]?.value ?? '');
  const [touched, setTouched] = useState(false);
  const [placing, setPlacing] = useState(false);
  const { schedule } = useTimers();
  const invalid = name.trim().length < 2;

  if (cart.length === 0 && !placing) {
    return (
      <CartPage
        copy={copy}
        accent={accent}
        cart={cart}
        hint={null}
        navigate={navigate}
        setCart={setCart}
      />
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (invalid || placing) return;
    setPlacing(true);
    const { total } = cartTotals(cart, copy.products);
    const number = orderNumber(total + cart.length + name.length);
    schedule(() => {
      setCart([]);
      navigate(`/order/${number}`);
    }, PLACING_DELAY);
  };

  return (
    <section className="px-5 py-6 @md:px-8 @md:py-8">
      <PageTitle>{copy.checkout.title}</PageTitle>
      <form
        noValidate
        onSubmit={submit}
        className="mt-5 grid grid-cols-1 gap-5 @2xl:grid-cols-[minmax(0,1fr)_16rem]"
      >
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
          <label className="block text-[0.75rem] text-black/60">
            {copy.checkout.name}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={copy.checkout.namePlaceholder}
              data-guide="checkout-name"
              autoComplete="off"
              aria-invalid={touched && invalid}
              aria-describedby={touched && invalid ? `${id}-error` : undefined}
              className={`${FIELD} text-black ${touched && invalid ? 'border-[#c4321f]' : ''}`}
            />
            {touched && invalid ? (
              <span id={`${id}-error`} className="mt-1 block text-[0.6875rem] text-[#b42a19]">
                {copy.checkout.nameError}
              </span>
            ) : null}
          </label>
          <label className="block text-[0.75rem] text-black/60">
            {copy.checkout.city}
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={`${FIELD} cursor-pointer text-black`}
            >
              {copy.checkout.cities.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-[0.75rem] text-black/60">{copy.checkout.payment}</legend>
            <div className="mt-1 grid gap-1.5 @sm:grid-cols-2">
              {copy.checkout.payments.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[0.8125rem] transition-colors ${payment === option.value ? 'border-black/50' : 'border-black/15 hover:border-black/30'}`}
                >
                  <input
                    type="radio"
                    name={`${id}-payment`}
                    value={option.value}
                    checked={payment === option.value}
                    onChange={() => setPayment(option.value)}
                    style={{ accentColor: accent }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="self-start rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
          <p className="mb-3 text-[0.8125rem] font-medium">{copy.checkout.summary}</p>
          <Summary
            copy={copy}
            cart={cart}
            action={
              <>
                <StoreButton accent={accent} type="submit" disabled={placing} guide="place-order">
                  {placing ? copy.checkout.placing : copy.checkout.place}
                </StoreButton>
                <Guide label={placing ? null : hint} side="top" className="-top-1.5 -right-1.5" />
              </>
            }
          />
        </div>
      </form>
    </section>
  );
}
