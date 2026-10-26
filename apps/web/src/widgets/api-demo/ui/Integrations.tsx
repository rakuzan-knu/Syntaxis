import { Check, Database, LoaderCircle, Mail, Send, Truck } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { fillTemplate } from '@/shared/lib';
import {
  RETRY_BACKOFF,
  isDelivered,
  visibleAttempts,
  type Delivery,
  type IntegrationId,
} from '../model/integrations';

const ICONS: Readonly<Record<IntegrationId, typeof Database>> = {
  crm: Database,
  shipping: Truck,
  telegram: Send,
  email: Mail,
};

interface IntegrationsProps {
  copy: Dictionary['api']['integrations'];
  deliveries: readonly Delivery[];
  revealed: number;
}

export function Integrations({ copy, deliveries, revealed }: IntegrationsProps) {
  const visible = visibleAttempts(deliveries, revealed);
  return (
    <div className="p-4 text-[0.8125rem]">
      <p className="mb-3 text-[0.75rem] text-win-muted">{copy.lead}</p>
      <ul className="flex flex-col gap-2">
        {deliveries.map((delivery, index) => {
          const attempts = visible[index] ?? [];
          const delivered = isDelivered(attempts);
          const Icon = ICONS[delivery.id];
          return (
            <li
              key={delivery.id}
              className={`rounded-lg border p-2.5 transition-colors ${delivered ? 'border-ok/40 bg-ok/5' : 'border-win-line'}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-win-muted" />
                <span className="min-w-0 flex-1 truncate font-medium text-win-text">
                  {copy.names[delivery.id]}
                </span>
                {delivered ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] text-ok">
                    <Check aria-hidden="true" className="size-3.5" />
                    {copy.delivered}
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] text-win-muted">
                    <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                    {copy.waiting}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-[0.6875rem] text-win-muted">
                {delivery.request}
              </p>
              {attempts.length > 0 ? (
                <ol className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[0.6875rem]">
                  {attempts.map((attempt, position) => (
                    <li key={attempt.at} className="ink-in flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 font-bold ${attempt.status < 400 ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'}`}
                      >
                        {attempt.status}
                      </span>
                      <span className="text-win-muted">{attempt.ms} ms</span>
                      {attempt.status >= 400 && position < RETRY_BACKOFF.length ? (
                        <span className="text-win-muted">
                          ·{' '}
                          {fillTemplate(copy.retry, {
                            seconds: String((RETRY_BACKOFF[position] ?? 0) / 1000),
                          })}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
