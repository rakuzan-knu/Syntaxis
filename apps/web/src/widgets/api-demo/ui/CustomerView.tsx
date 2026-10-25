import { BellRing, CircleAlert, CircleCheck, CreditCard, PackageX, Smartphone } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { fillTemplate } from '@/shared/lib';
import type { ApiResult, Outcome } from '../model/endpoints';

interface CustomerViewProps {
  copy: Dictionary['api']['customer'];
  result: ApiResult | null;
  pending: boolean;
  brand: string;
}

const TONE: Record<Outcome, 'ok' | 'bad' | 'info'> = {
  products: 'info',
  created: 'info',
  outOfStock: 'bad',
  declined: 'bad',
  paid: 'ok',
  notFound: 'bad',
  webhook: 'ok',
};

const ICON = {
  products: Smartphone,
  created: CreditCard,
  outOfStock: PackageX,
  declined: CircleAlert,
  paid: CircleCheck,
  notFound: CircleAlert,
  webhook: BellRing,
} as const;

function field(body: unknown, key: string): string {
  if (typeof body !== 'object' || body === null || !(key in body)) return '';
  const value: unknown = Reflect.get(body, key);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function deliveryOf(body: unknown): { branch: string; days: string } {
  const delivery: unknown =
    typeof body === 'object' && body !== null ? Reflect.get(body, 'delivery') : null;
  return { branch: field(delivery, 'branch'), days: field(delivery, 'eta_days') };
}

function messageFor(copy: CustomerViewProps['copy'], result: ApiResult): string {
  const values = {
    count: field(result.body, 'total'),
    id: field(result.body, 'id'),
    total: field(result.body, 'total'),
    ...deliveryOf(result.body),
  };
  return fillTemplate(copy[result.outcome], values);
}

export function CustomerView({ copy, result, pending, brand }: CustomerViewProps) {
  const outcome = result && !pending ? result.outcome : null;
  const tone = outcome ? TONE[outcome] : 'info';
  const Icon = outcome ? ICON[outcome] : Smartphone;

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-5">
      <p className="self-start text-[0.6875rem] font-semibold text-win-muted">{copy.title}</p>
      <div className="w-full max-w-[13.5rem] rounded-[1.75rem] border-[5px] border-[#1d2027] bg-[#f7f4ef] p-3 text-[#1d1a17] shadow-lg">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" />
        <p className="mb-3 text-[0.8125rem] font-semibold">{brand}</p>
        <div
          key={`${outcome ?? 'idle'}-${result?.size ?? 0}`}
          aria-live="polite"
          className={`ink-in flex min-h-[8.5rem] flex-col gap-2.5 rounded-xl p-3 text-[0.75rem] leading-snug ${tone === 'bad' ? 'bg-[#fdecea]' : tone === 'ok' ? 'bg-[#e8f6ee]' : 'bg-white'}`}
        >
          <Icon
            aria-hidden="true"
            className={`size-5 ${tone === 'bad' ? 'text-[#b42318]' : tone === 'ok' ? 'text-[#157f48]' : 'text-black/50'} ${pending ? 'animate-pulse' : ''}`}
          />
          <p>{pending ? '…' : result ? messageFor(copy, result) : copy.idle}</p>
          {outcome === 'created' ? (
            <span className="mt-auto rounded-full bg-[#2f3bff] py-1.5 text-center font-medium text-white">
              {copy.pay}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
