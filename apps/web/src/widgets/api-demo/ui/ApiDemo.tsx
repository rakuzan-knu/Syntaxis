import { useRef, useState } from 'react';
import { Check, ChevronDown, Folder, LoaderCircle, Minus, Plus, X } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { fillTemplate, useAutoplay, usePrefersReducedMotion } from '@/shared/lib';
import { Callout, CodeBlock, Hotspot, Showcase, Window } from '@/shared/ui';
import { MAX_QUANTITY, MIN_QUANTITY, clampQuantity, requestBody } from '../model/createOrder';
import {
  ENDPOINTS,
  formatSize,
  respond,
  type ApiResult,
  type EndpointId,
  type Environment,
  type Order,
  type Scenario,
} from '../model/endpoints';
import { CustomerView } from './CustomerView';

type RequestTab = 'params' | 'headers' | 'body';
type ResponseTab = 'body' | 'headers' | 'tests';

const METHOD_TONE = { GET: 'text-ok', POST: 'text-warn' } as const;

const toLines = (json: string) => json.split('\n').map((line) => [line] as const);

interface HistoryEntry {
  endpoint: EndpointId;
  status: number;
  sequence: number;
}

function KeyValueTable({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <table className="w-full font-mono text-[0.75rem]">
      <tbody>
        {rows.map(([key, value]) => (
          <tr key={key} className="border-b border-win-line/60">
            <td className="w-52 px-4 py-2 align-top text-win-text">{key}</td>
            <td className="px-4 py-2 break-all text-win-muted">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ApiDemo() {
  const { t } = useI18n();
  const copy = t.api;
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const [endpoint, setEndpoint] = useState<EndpointId>('createOrder');
  const [quantity, setQuantity] = useState(2);
  const [city, setCity] = useState(copy.cities[0]?.value ?? 'kyiv');
  const [payment, setPayment] = useState(copy.payments[0]?.value ?? 'liqpay');
  const [sequence, setSequence] = useState(0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<readonly HistoryEntry[]>([]);
  const [requestTab, setRequestTab] = useState<RequestTab>('body');
  const [responseTab, setResponseTab] = useState<ResponseTab>('body');
  const [scenario, setScenario] = useState<Scenario>('ok');
  const [environment, setEnvironment] = useState<Environment>('production');
  const [triedError, setTriedError] = useState(false);

  const current = ENDPOINTS.find((item) => item.id === endpoint);
  const method = current?.method ?? 'GET';
  const request = { product: copy.product, quantity, city, payment };

  const deliver = (later: (callback: () => void, delay: number) => void) => {
    const next = sequence + 1;
    const outcome = respond(endpoint, {
      request,
      sequence: next,
      lastOrder,
      scenario,
      environment,
    });
    setSequence(next);
    setPending(true);
    later(
      () => {
        setPending(false);
        setResult(outcome);
        setResponseTab('body');
        setHistory((items) =>
          [{ endpoint, status: outcome.status, sequence: next }, ...items].slice(0, 4),
        );
        if (outcome.order) setLastOrder(outcome.order);
      },
      reduceMotion ? 0 : 350 + outcome.latency,
    );
  };

  const { schedule, interrupt, touched } = useAutoplay(rootRef, (later) => {
    later(() => deliver(later), 700);
  });

  const send = () => {
    interrupt();
    deliver(schedule);
  };

  const change = (apply: () => void) => {
    interrupt();
    apply();
  };

  const pickEndpoint = (id: EndpointId) => {
    setEndpoint(id);
    setResult(null);
    setRequestTab(ENDPOINTS.find((item) => item.id === id)?.method === 'POST' ? 'body' : 'params');
  };

  const pick = (id: EndpointId) => change(() => pickEndpoint(id));

  const plain =
    pending || !result
      ? pending
        ? copy.plain.sending
        : copy.plain.idle
      : `${fillTemplate(copy.plain[result.outcome], { ms: String(result.latency) })}${environment === 'staging' ? ` ${copy.plain.staging}` : ''}`;

  const body =
    endpoint === 'createOrder'
      ? requestBody(request)
      : endpoint === 'webhook'
        ? JSON.stringify({ invoiceId: lastOrder?.id ?? 'ord_…', status: 'success' }, null, 2)
        : '';

  const requestHeaders: readonly (readonly [string, string])[] = [
    ['Authorization', 'Bearer {{token}}'],
    ['Content-Type', 'application/json'],
    ['Idempotency-Key', `ik_${(sequence + 1).toString(36).padStart(4, '0')}`],
    ['User-Agent', 'zerno-web/1.4.0'],
  ];

  const selectClass =
    'mt-1.5 block w-full cursor-pointer rounded-md bg-win-raised px-2.5 py-1.5 text-[0.8125rem] text-win-text';
  const stepperClass =
    'grid size-7 cursor-pointer place-items-center rounded-md bg-win-raised hover:bg-win-line disabled:opacity-40';

  return (
    <Showcase
      id="api"
      title={copy.title}
      lead={copy.lead}
      benefit={copy.benefit}
      callouts={copy.callouts}
      caption={plain}
      glossary={copy.glossary}
    >
      <div ref={rootRef}>
        <Window title={copy.window}>
          <div className="flex h-10 items-center gap-3 border-b border-win-line px-4 text-[0.75rem] text-win-muted">
            <span className="font-medium text-win-text">Zerno API</span>
            <button
              type="button"
              onClick={() =>
                change(() =>
                  setEnvironment((value) => (value === 'production' ? 'staging' : 'production')),
                )
              }
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-win-raised px-2.5 py-1 hover:text-win-text"
            >
              <span
                className={`size-1.5 rounded-full ${environment === 'production' ? 'bg-ok' : 'bg-warn'}`}
              />
              {copy.environments[environment]}
              <ChevronDown aria-hidden="true" className="size-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_15rem]">
            <aside className="relative border-b border-win-line py-3 text-[0.8125rem] lg:border-r lg:border-b-0">
              <Callout n={1} className="top-3 right-3" />
              <p className="px-4 pb-2 text-[0.6875rem] font-semibold tracking-wide text-win-muted">
                COLLECTIONS
              </p>
              <p className="flex items-center gap-1.5 px-3 py-1 text-win-text">
                <ChevronDown aria-hidden="true" className="size-3.5" />
                <Folder aria-hidden="true" className="size-3.5 text-win-muted" />
                Zerno API
              </p>
              <ul>
                {ENDPOINTS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={endpoint === item.id}
                      onClick={() => pick(item.id)}
                      className={`flex w-full cursor-pointer items-center gap-2 py-1.5 pr-3 pl-9 text-left font-mono text-[0.75rem] ${endpoint === item.id ? 'bg-win-raised text-win-text' : 'text-win-muted hover:text-win-text'}`}
                    >
                      <span
                        className={`w-9 shrink-0 text-[0.625rem] font-bold ${METHOD_TONE[item.method]}`}
                      >
                        {item.method}
                      </span>
                      <span className="truncate">{item.path}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 hidden px-4 pb-2 text-[0.6875rem] font-semibold tracking-wide text-win-muted lg:block">
                HISTORY
              </p>
              <ul className="hidden lg:block">
                {history.map((entry) => (
                  <li
                    key={entry.sequence}
                    className="log-line flex items-center gap-2 px-4 py-1 font-mono text-[0.6875rem] text-win-muted"
                  >
                    <span className={entry.status < 400 ? 'text-ok' : 'text-bad'}>
                      {entry.status}
                    </span>
                    <span className="truncate">
                      {ENDPOINTS.find((candidate) => candidate.id === entry.endpoint)?.path}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="flex min-w-0 flex-col">
              <div className="flex h-9 items-stretch border-b border-win-line text-[0.75rem]">
                <span className="flex items-center gap-2 border-t-2 border-r border-win-line border-t-warn px-3 text-win-text">
                  <span className={`font-mono text-[0.625rem] font-bold ${METHOD_TONE[method]}`}>
                    {method}
                  </span>
                  {current?.path}
                  <X aria-hidden="true" className="size-3 text-win-muted" />
                </span>
              </div>

              <div className="relative flex items-center gap-2 p-3">
                <Callout n={2} className="-top-2 right-24" />
                <span className="flex min-w-0 flex-1 items-center overflow-hidden rounded-md border border-win-line bg-win-raised font-mono text-[0.8125rem]">
                  <span
                    className={`border-r border-win-line px-3 py-1.5 font-bold ${METHOD_TONE[method]}`}
                  >
                    {method}
                  </span>
                  <span className="truncate px-3">
                    <span className="syn-keyword">
                      {environment === 'production'
                        ? 'api.zerno.example'
                        : 'staging.api.zerno.example'}
                    </span>
                    {current?.path.replace(':id', lastOrder?.id ?? ':id')}
                  </span>
                </span>
                <span className="relative">
                  <button
                    type="button"
                    onClick={send}
                    disabled={pending}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-win-accent px-4 py-1.5 text-step--1 font-semibold text-win disabled:cursor-wait disabled:opacity-70"
                  >
                    {pending ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-3.5 animate-[spin_0.8s_linear_infinite]"
                      />
                    ) : null}
                    Send
                  </button>
                  <Hotspot
                    label={copy.hints[0] ?? ''}
                    visible={!touched}
                    className="top-full left-1/2 mt-3"
                    side="left"
                  />
                </span>
              </div>

              <div className="relative flex flex-wrap items-center gap-2 border-t border-win-line px-3 py-2 text-[0.75rem]">
                <span className="text-win-muted">{copy.scenarioLabel}</span>
                <div
                  role="radiogroup"
                  aria-label={copy.scenarioLabel}
                  className="flex flex-wrap gap-1"
                >
                  {(['ok', 'outOfStock', 'declined'] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={scenario === id}
                      onClick={() =>
                        change(() => {
                          setScenario(id);
                          if (id !== 'ok') setTriedError(true);
                          if (endpoint !== 'createOrder' && id !== 'ok')
                            pickEndpoint('createOrder');
                        })
                      }
                      className={`cursor-pointer rounded-full border px-2.5 py-1 transition-colors ${scenario === id ? (id === 'ok' ? 'border-ok/50 bg-ok/10 text-win-text' : 'border-bad/50 bg-bad/10 text-win-text') : 'border-win-line text-win-muted hover:text-win-text'}`}
                    >
                      {copy.scenarios[id]}
                    </button>
                  ))}
                </div>
                <Hotspot
                  label={copy.nextHint}
                  visible={touched && history.length > 0 && !triedError}
                  className="top-1/2 right-6 -mt-1.5"
                  side="left"
                />
              </div>

              <div
                role="tablist"
                aria-label="Request"
                className="flex gap-4 border-b border-win-line px-4 text-[0.75rem]"
              >
                {(['params', 'headers', 'body'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={requestTab === id}
                    onClick={() => setRequestTab(id)}
                    className={`-mb-px cursor-pointer border-b-2 py-2 capitalize ${requestTab === id ? 'border-warn text-win-text' : 'border-transparent text-win-muted hover:text-win-text'}`}
                  >
                    {id}
                    {id === 'headers' ? (
                      <span className="ml-1 text-win-muted">({requestHeaders.length})</span>
                    ) : null}
                    {id === 'body' && method === 'POST' ? (
                      <span className="ml-1 text-ok">●</span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="min-h-[13rem] border-b border-win-line">
                {requestTab === 'body' && endpoint === 'createOrder' ? (
                  <div className="grid gap-4 p-4 xl:grid-cols-[13rem_minmax(0,1fr)]">
                    <div className="grid content-start gap-4">
                      <div>
                        <p className="text-[0.6875rem] text-win-muted">{copy.quantity}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="−1"
                            disabled={quantity <= MIN_QUANTITY}
                            onClick={() =>
                              change(() => setQuantity((value) => clampQuantity(value - 1)))
                            }
                            className={stepperClass}
                          >
                            <Minus aria-hidden="true" className="size-3.5" />
                          </button>
                          <output
                            aria-label={copy.quantity}
                            className="w-6 text-center font-mono tabular-nums"
                          >
                            {quantity}
                          </output>
                          <button
                            type="button"
                            aria-label="+1"
                            disabled={quantity >= MAX_QUANTITY}
                            onClick={() =>
                              change(() => setQuantity((value) => clampQuantity(value + 1)))
                            }
                            className={stepperClass}
                          >
                            <Plus aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <label className="block text-[0.6875rem] text-win-muted">
                        {copy.city}
                        <select
                          value={city}
                          onChange={(event) => change(() => setCity(event.target.value))}
                          className={selectClass}
                        >
                          {copy.cities.map((choice) => (
                            <option key={choice.value} value={choice.value}>
                              {choice.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-[0.6875rem] text-win-muted">
                        {copy.payment}
                        <select
                          value={payment}
                          onChange={(event) => change(() => setPayment(event.target.value))}
                          className={selectClass}
                        >
                          {copy.payments.map((choice) => (
                            <option key={choice.value} value={choice.value}>
                              {choice.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <CodeBlock
                      language="json"
                      lines={toLines(body)}
                      className="max-h-56 overflow-y-auto"
                    />
                  </div>
                ) : requestTab === 'body' && body ? (
                  <CodeBlock language="json" lines={toLines(body)} className="p-4" />
                ) : requestTab === 'headers' ? (
                  <KeyValueTable rows={requestHeaders} />
                ) : (
                  <p className="p-4 font-mono text-[0.75rem] text-win-muted">
                    {endpoint === 'getOrder' ? `id = ${lastOrder?.id ?? '—'}` : 'No parameters'}
                  </p>
                )}
              </div>

              <div className="relative flex min-h-[18rem] flex-col">
                <Callout n={3} className="top-2 right-3" />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-win-line px-4 py-2 text-[0.75rem]">
                  <div role="tablist" aria-label="Response" className="flex gap-4">
                    {(['body', 'headers', 'tests'] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={responseTab === id}
                        onClick={() => setResponseTab(id)}
                        className={`cursor-pointer capitalize ${responseTab === id ? 'text-win-text' : 'text-win-muted hover:text-win-text'}`}
                      >
                        {id === 'tests' && result
                          ? `Test Results (${result.tests.filter((test) => test.passed).length}/${result.tests.length})`
                          : id}
                      </button>
                    ))}
                  </div>
                  {result && !pending ? (
                    <span
                      key={`${result.latency}-${result.size}`}
                      className="ink-in ml-auto flex gap-3 font-mono text-[0.6875rem]"
                    >
                      <span className={result.status < 400 ? 'text-ok' : 'text-bad'}>
                        {result.status} {result.statusText}
                      </span>
                      <span className="text-win-muted">{result.latency} ms</span>
                      <span className="text-win-muted">{formatSize(result.size)}</span>
                    </span>
                  ) : null}
                </div>
                <div aria-live="polite" className="flex-1">
                  {pending || !result ? (
                    <p className="grid h-full min-h-[14rem] place-items-center p-6 text-center text-[0.8125rem] text-win-muted">
                      {pending ? copy.sending : copy.idle}
                    </p>
                  ) : responseTab === 'body' ? (
                    <CodeBlock
                      key={`${result.latency}-${result.size}`}
                      language="json"
                      lines={toLines(JSON.stringify(result.body, null, 2))}
                      className="ink-in max-h-80 overflow-y-auto py-3"
                    />
                  ) : responseTab === 'headers' ? (
                    <KeyValueTable rows={result.headers} />
                  ) : (
                    <ul className="p-4 text-[0.8125rem]">
                      {result.tests.map((test) => (
                        <li key={test.name} className="flex items-center gap-2.5 py-1">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[0.625rem] font-bold ${test.passed ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'}`}
                          >
                            {test.passed ? 'PASS' : 'FAIL'}
                          </span>
                          {test.name}
                          {test.passed ? (
                            <Check aria-hidden="true" className="size-3.5 text-ok" />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="relative border-t border-win-line lg:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l">
              <Callout n={4} className="top-3 right-3" />
              <CustomerView
                copy={copy.customer}
                result={result}
                pending={pending}
                brand={t.build.demo.brand}
              />
            </div>
          </div>
        </Window>
      </div>
    </Showcase>
  );
}
