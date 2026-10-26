import { Integrations } from './Integrations';
import { fanOut, revealOrder, type Delivery } from '../model/integrations';
import { useRef, useState } from 'react';
import {
  Activity,
  Check,
  ChevronDown,
  Copy,
  Folder,
  LoaderCircle,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import {
  fillTemplate,
  useAutoplay,
  useCopyToClipboard,
  useDemoCommands,
  usePrefersReducedMotion,
} from '@/shared/lib';
import {
  Callout,
  CodeBlock,
  DemoPlayer,
  DesktopWindow,
  GuideCursor,
  Hotspot,
  Showcase,
  Window,
} from '@/shared/ui';
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
  invalidResult,
} from '../model/endpoints';
import { parseOrderBody, snippet, type SnippetLanguage } from '../model/requestTools';
import { LoadTest } from './LoadTest';
import { CustomerView } from './CustomerView';

type RequestTab = 'params' | 'headers' | 'body' | 'code';
type ResponseTab = 'body' | 'headers' | 'tests' | 'events';

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

const CHAPTERS = [0, 3200, 8800] as const;

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
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [raw, setRaw] = useState('');
  const [language, setLanguage] = useState<SnippetLanguage>('curl');
  const [loadOpen, setLoadOpen] = useState(false);
  const [crmDown, setCrmDown] = useState(false);
  const [deliveries, setDeliveries] = useState<readonly Delivery[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [loadSummary, setLoadSummary] = useState<{ instances: number; peakP95: number } | null>(
    null,
  );
  const { copied, copy: copyText } = useCopyToClipboard();

  const current = ENDPOINTS.find((item) => item.id === endpoint);
  const method = current?.method ?? 'GET';
  const request = { product: copy.product, quantity, city, payment };

  const deliver = (later: (callback: () => void, delay: number) => void) => {
    const next = sequence + 1;
    const parsed =
      endpoint === 'createOrder' && mode === 'json'
        ? parseOrderBody(
            raw,
            copy.cities.map((choice) => choice.value),
            copy.payments.map((choice) => choice.value),
          )
        : null;
    const outcome =
      parsed && !parsed.ok
        ? invalidResult(parsed.status, parsed.body, next, environment)
        : respond(endpoint, {
            request: parsed?.ok
              ? {
                  product: copy.product,
                  quantity: parsed.quantity,
                  city: parsed.city,
                  payment: parsed.payment,
                }
              : request,
            sequence: next,
            lastOrder,
            scenario,
            environment,
          });
    setSequence(next);
    setPending(true);
    const delay = reduceMotion ? 0 : 350 + outcome.latency;
    const events = outcome.outcome === 'webhook' ? fanOut(next, crmDown) : [];
    revealOrder(events).forEach((item, index) => {
      later(() => setRevealed(index + 1), reduceMotion ? 0 : delay + item.at);
    });
    later(() => {
      setPending(false);
      setResult(outcome);
      setDeliveries(events);
      setRevealed(0);
      setResponseTab(events.length > 0 ? 'events' : 'body');
      setHistory((items) =>
        [{ endpoint, status: outcome.status, sequence: next }, ...items].slice(0, 4),
      );
      if (outcome.order) setLastOrder(outcome.order);
    }, delay);
  };

  const reset = () => {
    setEndpoint('createOrder');
    setQuantity(2);
    setCity(copy.cities[0]?.value ?? 'kyiv');
    setPayment(copy.payments[0]?.value ?? 'liqpay');
    setSequence(0);
    setPending(false);
    setResult(null);
    setLastOrder(null);
    setHistory([]);
    setRequestTab('body');
    setResponseTab('body');
    setScenario('ok');
    setEnvironment('production');
    setTriedError(false);
    setMode('form');
    setRaw('');
    setLoadOpen(false);
    setLoadSummary(null);
    setCrmDown(false);
    setDeliveries([]);
    setRevealed(0);
  };

  const { schedule, interrupt, touched, player } = useAutoplay(
    rootRef,
    (later) => {
      const [, error = 0, settle = 0] = CHAPTERS;
      later(() => undefined, 800, { target: '[data-guide="send"]', press: true });
      later(() => undefined, error, { target: '[data-guide="scenario-outOfStock"]', press: true });
      later(() => undefined, error + 1200, { target: '[data-guide="send"]', press: true });
      later(() => undefined, error + 2900, {
        target: '[data-guide="scenario-declined"]',
        press: true,
      });
      later(() => undefined, error + 4100, { target: '[data-guide="send"]', press: true });
      later(() => undefined, settle, { target: '[data-guide="scenario-ok"]', press: true });
      later(() => undefined, settle + 1100, { target: '[data-guide="send"]', press: true });
      later(() => undefined, settle + 2800, {
        target: '[data-guide="endpoint-webhook"]',
        press: true,
      });
      later(() => undefined, settle + 3800, { target: '[data-guide="crm-down"]', press: true });
      later(() => undefined, settle + 4800, { target: '[data-guide="send"]', press: true });
      later(() => undefined, settle + 9600, {
        target: '[data-guide="endpoint-getOrder"]',
        press: true,
      });
      later(() => undefined, settle + 10800, { target: '[data-guide="send"]', press: true });
    },
    { reset, chapters: CHAPTERS },
  );

  useDemoCommands('api', player);

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

  const plain = loadSummary
    ? fillTemplate(copy.load.plain, {
        instances: String(loadSummary.instances),
        p95: String(loadSummary.peakP95),
      })
    : pending || !result
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

  const host = environment === 'production' ? 'api.zerno.example' : 'staging.api.zerno.example';
  const url = `https://${host}${current?.path.replace(':id', lastOrder?.id ?? ':id') ?? ''}`;
  const sentBody = endpoint === 'createOrder' && mode === 'json' ? raw : body;

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
      player={<DemoPlayer player={player} labels={copy.chapters} />}
    >
      <div ref={rootRef} className="relative lg:h-full">
        <GuideCursor cursor={player.cursor} name={t.ui.player.guide} />
        <DesktopWindow id="main" title={copy.window} className="lg:h-full">
          <Window title={copy.window} className="h-full">
            <div className="flex h-full flex-col">
              <div className="flex h-10 shrink-0 items-center gap-3 border-b border-win-line px-4 text-[0.75rem] text-win-muted">
                <span className="font-medium text-win-text">Zerno API</span>
                <button
                  type="button"
                  data-guide="load-test"
                  onClick={() => change(() => setLoadOpen(true))}
                  className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-win-raised px-2.5 py-1 hover:text-win-text"
                >
                  <Activity aria-hidden="true" className="size-3.5 text-win-accent" />
                  {copy.load.button}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    change(() =>
                      setEnvironment((value) =>
                        value === 'production' ? 'staging' : 'production',
                      ),
                    )
                  }
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-win-raised px-2.5 py-1 hover:text-win-text"
                >
                  <span
                    className={`size-1.5 rounded-full ${environment === 'production' ? 'bg-ok' : 'bg-warn'}`}
                  />
                  {copy.environments[environment]}
                  <ChevronDown aria-hidden="true" className="size-3" />
                </button>
              </div>

              <div className="scroll-area grid grid-cols-1 lg:min-h-0 lg:flex-1 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_15rem] xl:grid-rows-[minmax(0,1fr)]">
                <aside className="scroll-area relative border-b border-win-line py-3 text-[0.8125rem] lg:border-r lg:border-b-0">
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
                          data-guide={`endpoint-${item.id}`}
                          onClick={() => pick(item.id)}
                          className={`flex min-h-8 w-full cursor-pointer items-center gap-2 py-1.5 pr-3 pl-9 text-left font-mono text-[0.75rem] ${endpoint === item.id ? 'bg-win-raised text-win-text' : 'text-win-muted hover:text-win-text'}`}
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

                <div className="scroll-area relative flex min-w-0 flex-col">
                  {loadOpen ? (
                    <LoadTest
                      copy={copy.load}
                      schedule={schedule}
                      onFinish={(summary) => setLoadSummary(summary)}
                      onClose={() => {
                        setLoadOpen(false);
                        setLoadSummary(null);
                      }}
                    />
                  ) : null}
                  <div className="flex h-9 items-stretch border-b border-win-line text-[0.75rem]">
                    <span className="flex items-center gap-2 border-t-2 border-r border-win-line border-t-warn px-3 text-win-text">
                      <span
                        className={`font-mono text-[0.625rem] font-bold ${METHOD_TONE[method]}`}
                      >
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
                        data-guide="send"
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
                          data-guide={`scenario-${id}`}
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
                      {endpoint === 'webhook' ? (
                        <button
                          type="button"
                          aria-pressed={crmDown}
                          data-guide="crm-down"
                          onClick={() => change(() => setCrmDown((value) => !value))}
                          className={`cursor-pointer rounded-full border px-2.5 py-1 transition-colors ${crmDown ? 'border-bad/50 bg-bad/10 text-win-text' : 'border-win-line text-win-muted hover:text-win-text'}`}
                        >
                          {copy.integrations.crmDown}
                        </button>
                      ) : null}
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
                    {(['params', 'headers', 'body', 'code'] as const).map((id) => (
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
                    {requestTab === 'code' ? (
                      <div className="p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <div
                            role="radiogroup"
                            aria-label={copy.code.tab}
                            className="flex rounded-md bg-win-raised p-0.5 text-[0.75rem]"
                          >
                            {(
                              [
                                ['curl', 'cURL'],
                                ['fetch', 'fetch'],
                                ['python', 'Python'],
                              ] as const
                            ).map(([id, label]) => (
                              <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={language === id}
                                onClick={() => setLanguage(id)}
                                className={`cursor-pointer rounded px-2.5 py-1 ${language === id ? 'bg-win text-win-text shadow-sm' : 'text-win-muted hover:text-win-text'}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void copyText(
                                snippet(language, {
                                  method,
                                  url,
                                  headers: requestHeaders,
                                  body: sentBody,
                                }),
                              )
                            }
                            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[0.75rem] text-win-muted hover:bg-win-raised hover:text-win-text"
                          >
                            {copied ? (
                              <Check aria-hidden="true" className="size-3.5 text-ok" />
                            ) : (
                              <Copy aria-hidden="true" className="size-3.5" />
                            )}
                            <span aria-live="polite">
                              {copied ? copy.code.copied : copy.code.copy}
                            </span>
                          </button>
                        </div>
                        <CodeBlock
                          language={language === 'fetch' ? 'tsx' : 'bash'}
                          lines={toLines(
                            snippet(language, {
                              method,
                              url,
                              headers: requestHeaders,
                              body: sentBody,
                            }),
                          )}
                          className="max-h-56 overflow-y-auto rounded-md bg-win-raised px-3 py-2"
                        />
                      </div>
                    ) : requestTab === 'body' && endpoint === 'createOrder' && mode === 'json' ? (
                      <div className="p-3">
                        <ModeSwitch mode={mode} labels={copy.modes} onChange={setMode} />
                        <textarea
                          value={raw}
                          spellCheck={false}
                          aria-label="JSON"
                          onChange={(event) => change(() => setRaw(event.target.value))}
                          className="mt-2 h-44 w-full resize-none rounded-md border border-win-line bg-win-raised p-3 font-mono text-[0.75rem] leading-relaxed text-win-text outline-none focus:border-win-accent"
                        />
                      </div>
                    ) : requestTab === 'body' && endpoint === 'createOrder' ? (
                      <div className="grid gap-4 p-4 xl:grid-cols-[13rem_minmax(0,1fr)]">
                        <div className="grid content-start gap-4">
                          <ModeSwitch
                            mode={mode}
                            labels={copy.modes}
                            onChange={(next) => {
                              setRaw(body);
                              setMode(next);
                            }}
                          />
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
                        {(deliveries.length > 0
                          ? (['events', 'body', 'headers', 'tests'] as const)
                          : (['body', 'headers', 'tests'] as const)
                        ).map((id) => (
                          <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={responseTab === id}
                            onClick={() => setResponseTab(id)}
                            className={`cursor-pointer capitalize ${responseTab === id ? 'text-win-text' : 'text-win-muted hover:text-win-text'}`}
                          >
                            {id === 'events'
                              ? copy.integrations.tab
                              : id === 'tests' && result
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
                      ) : responseTab === 'events' ? (
                        <Integrations
                          copy={copy.integrations}
                          deliveries={deliveries}
                          revealed={revealed}
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
                <div className="scroll-area relative border-t border-win-line lg:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l">
                  <Callout n={4} className="top-3 right-3" />
                  <CustomerView
                    copy={copy.customer}
                    result={result}
                    pending={pending}
                    brand={t.build.demo.brand}
                  />
                </div>
              </div>
            </div>
          </Window>
        </DesktopWindow>
      </div>
    </Showcase>
  );
}

function ModeSwitch({
  mode,
  labels,
  onChange,
}: {
  mode: 'form' | 'json';
  labels: { form: string; json: string };
  onChange: (mode: 'form' | 'json') => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Body"
      className="flex w-fit rounded-md bg-win-raised p-0.5 text-[0.75rem]"
    >
      {(['form', 'json'] as const).map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          onClick={() => onChange(id)}
          className={`cursor-pointer rounded px-2.5 py-1 ${mode === id ? 'bg-win text-win-text shadow-sm' : 'text-win-muted hover:text-win-text'}`}
        >
          {labels[id]}
        </button>
      ))}
    </div>
  );
}
