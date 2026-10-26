import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp, ChevronDown, ShoppingBag, Sparkles } from 'lucide-react';
import { fillTemplate, useTimers } from '@/shared/lib';
import {
  EMPTY_PREFERENCES,
  grindFor,
  nextMove,
  readPreferences,
  recommend,
  type Pick,
  type Preferences,
} from '../model/consultant';
import { addToCart, formatPrice, type CartLine } from '../model/store';
import { Bean, type StoreCopy } from './parts';

type Schedule = (callback: () => void, delay: number) => void;

interface UserMessage {
  id: number;
  from: 'user';
  text: string;
}

interface BotMessage {
  id: number;
  from: 'bot';
  text: string;
  chips?: readonly string[];
  picks?: readonly Pick[];
  cart?: boolean;
}

type Message = UserMessage | BotMessage;
type Draft = Omit<UserMessage, 'id'> | Omit<BotMessage, 'id'>;

interface ConsultantProps {
  copy: StoreCopy;
  accent: string;
  cart: readonly CartLine[];
  schedule?: Schedule | undefined;
  onCart: (cart: CartLine[]) => void;
  onNavigate: (path: string) => void;
  onEvent?: ((text: string) => void) | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

const REPLY_DELAY = 800;
const ADDED_DELAY = 500;

export function Consultant({
  copy,
  accent,
  cart,
  schedule,
  onCart,
  onNavigate,
  onEvent,
  onOpenChange,
}: ConsultantProps) {
  const text = copy.consultant;
  const timers = useTimers();
  const later = schedule ?? timers.schedule;
  const [open, setOpenState] = useState(false);
  const setOpen = (value: boolean) => {
    setOpenState(value);
    onOpenChange?.(value);
  };
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(EMPTY_PREFERENCES);
  const [messages, setMessages] = useState<readonly Message[]>(() => [
    { id: 0, from: 'bot', text: text.greeting, chips: text.starters },
  ]);
  const nextId = useRef(1);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing, open]);

  const push = (message: Draft) => {
    const id = nextId.current;
    nextId.current += 1;
    setMessages((current) => [...current, { ...message, id }]);
  };

  const reply = (message: Omit<BotMessage, 'id'>, delay: number) => {
    setTyping(true);
    later(() => {
      setTyping(false);
      push(message);
    }, delay);
  };

  const send = (value: string) => {
    const input = value.trim();
    if (!input || typing) return;
    push({ from: 'user', text: input });
    setDraft('');
    const next = readPreferences(input, text.signals, preferences);
    setPreferences(next);
    const move = nextMove(next);
    if (move === 'askTaste') {
      reply({ from: 'bot', text: text.askTaste, chips: text.tasteChips }, REPLY_DELAY);
      return;
    }
    if (move === 'askBrew') {
      reply({ from: 'bot', text: text.askBrew, chips: text.brewChips }, REPLY_DELAY);
      return;
    }
    const picks = recommend(next, copy.products);
    onEvent?.(`[assistant] recommend ${picks.map((pick) => pick.sku).join(', ')}`);
    reply(
      {
        from: 'bot',
        text: next.brew
          ? fillTemplate(text.recommend, { brew: text.brews[next.brew] })
          : text.recommendAny,
        picks,
      },
      REPLY_DELAY,
    );
  };

  const add = (sku: string) => {
    const grind = grindFor(preferences.brew);
    const product = copy.products.find((item) => item.sku === sku);
    const grindLabel = copy.grinds.find((item) => item.value === grind)?.label ?? grind;
    onCart(addToCart(cart, { sku, grind, weight: '250', quantity: 1 }));
    reply(
      {
        from: 'bot',
        text: fillTemplate(text.added, { name: product?.name ?? sku, grind: grindLabel }),
        cart: true,
      },
      ADDED_DELAY,
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };

  const lastId = messages.at(-1)?.id;

  if (!open) {
    return (
      <button
        type="button"
        data-guide="consultant"
        onClick={() => setOpen(true)}
        className="pointer-events-auto ml-auto flex cursor-pointer items-center gap-2 rounded-full py-2 pr-4 pl-2.5 text-[0.8125rem] font-medium text-white shadow-[0_6px_20px_rgb(0_0_0/0.18)] transition-transform hover:scale-[1.03] active:scale-95"
        style={{ backgroundColor: accent }}
      >
        <span className="grid size-6 place-items-center rounded-full bg-white/20">
          <Sparkles aria-hidden="true" className="size-3.5" />
        </span>
        {text.open}
      </button>
    );
  }

  return (
    <section
      aria-label={text.title}
      className="ink-in pointer-events-auto ml-auto flex max-h-full w-[min(19rem,100%)] flex-col overflow-hidden rounded-2xl bg-white font-sans text-[#1d1a17] shadow-[0_12px_40px_rgb(0_0_0/0.22),0_0_0_1px_rgb(0_0_0/0.06)]"
    >
      <header
        className="flex shrink-0 items-center gap-2.5 px-3.5 py-2.5 text-white"
        style={{ backgroundColor: accent }}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/20">
          <Sparkles aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-semibold">{text.title}</span>
          <span className="block truncate text-[0.6875rem] text-white/85">{text.status}</span>
        </span>
        <button
          type="button"
          aria-label={text.close}
          title={text.close}
          onClick={() => setOpen(false)}
          className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-white/15"
        >
          <ChevronDown aria-hidden="true" className="size-4" />
        </button>
      </header>

      <ol
        ref={listRef}
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain bg-[#f7f4ef] px-3 py-3 text-[0.8125rem]"
      >
        {messages.map((message) =>
          message.from === 'user' ? (
            <li
              key={message.id}
              className="ink-in max-w-[85%] self-end rounded-2xl rounded-br-md px-3 py-2 text-white"
              style={{ backgroundColor: accent }}
            >
              {message.text}
            </li>
          ) : (
            <li key={message.id} className="ink-in flex max-w-[92%] flex-col gap-2 self-start">
              <p className="rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
                {message.text}
              </p>
              {message.picks?.map((pick, index) => {
                const product = copy.products.find((item) => item.sku === pick.sku);
                if (!product) return null;
                return (
                  <div
                    key={pick.sku}
                    className="flex flex-col gap-2 rounded-xl bg-white p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#efe7dc]">
                        <Bean sku={product.sku} className="size-7" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{product.name}</span>
                        <span className="block truncate text-[0.75rem] text-black/60">
                          {product.note}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatPrice(product.price, copy.currency)}
                      </span>
                    </div>
                    {pick.reasons.length > 0 ? (
                      <ul className="flex flex-wrap gap-1">
                        {pick.reasons.map((reason) => (
                          <li
                            key={reason}
                            className="rounded-full bg-[#efe7dc] px-2 py-0.5 text-[0.6875rem] text-black/70"
                          >
                            {text.reasons[reason]}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      data-guide={
                        message.id === lastId && index === 0 ? 'consultant-add' : undefined
                      }
                      onClick={() => add(product.sku)}
                      className="cursor-pointer rounded-full border py-1.5 text-[0.75rem] font-medium transition-colors hover:bg-black/5"
                      style={{ borderColor: accent, color: accent }}
                    >
                      {text.add}
                    </button>
                  </div>
                );
              })}
              {message.cart ? (
                <button
                  type="button"
                  data-guide={message.id === lastId ? 'consultant-cart' : undefined}
                  onClick={() => {
                    setOpen(false);
                    onNavigate('/cart');
                  }}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-full px-3.5 py-1.5 text-[0.75rem] font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  <ShoppingBag aria-hidden="true" className="size-3.5" />
                  {text.toCart}
                </button>
              ) : null}
              {message.chips && message.id === lastId && !typing ? (
                <ul className="flex flex-wrap gap-1.5">
                  {message.chips.map((chip, index) => (
                    <li key={chip}>
                      <button
                        type="button"
                        data-guide={index === 0 ? 'consultant-chip' : undefined}
                        onClick={() => send(chip)}
                        className="cursor-pointer rounded-full border border-black/15 bg-white px-2.5 py-1 text-left text-[0.75rem] transition-colors hover:border-black/40"
                      >
                        {chip}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ),
        )}
        {typing ? (
          <li className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
            <span className="sr-only">{text.typing}</span>
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                aria-hidden="true"
                className="size-1.5 animate-bounce rounded-full bg-black/40"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </li>
        ) : null}
      </ol>

      <form
        onSubmit={submit}
        className="flex shrink-0 items-center gap-2 border-t border-black/10 p-2"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">{text.placeholder}</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={text.placeholder}
            maxLength={120}
            className="w-full rounded-full bg-[#f2eee8] px-3 py-1.5 text-[0.8125rem] outline-none placeholder:text-black/45 focus-visible:ring-2 focus-visible:ring-black/20"
          />
        </label>
        <button
          type="submit"
          aria-label={text.send}
          title={text.send}
          disabled={!draft.trim() || typing}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-white transition-opacity disabled:cursor-default disabled:opacity-40"
          style={{ backgroundColor: accent }}
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </button>
      </form>
      <p className="shrink-0 bg-white px-3 pb-2 text-center text-[0.625rem] text-black/55">
        {text.note}
      </p>
    </section>
  );
}
