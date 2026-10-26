export type ParsedBody =
  | { ok: true; quantity: number; city: string; payment: string }
  | { ok: false; status: 400 | 422; body: unknown };

interface FieldError {
  path: string;
  message: string;
}

function read(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
}

export function parseOrderBody(
  text: string,
  cities: readonly string[],
  providers: readonly string[],
): ParsedBody {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'invalid_json',
        message: error instanceof Error ? error.message : 'Unexpected token',
      },
    };
  }
  const errors: FieldError[] = [];
  const items = read(data, 'items');
  const first = Array.isArray(items) ? (items[0] as unknown) : undefined;
  const quantity = read(first, 'quantity');
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ path: 'items', message: 'must contain at least one item' });
  } else if (
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 9
  ) {
    errors.push({ path: 'items[0].quantity', message: 'must be an integer from 1 to 9' });
  }
  const city = read(read(data, 'delivery'), 'city');
  if (typeof city !== 'string' || !cities.includes(city)) {
    errors.push({ path: 'delivery.city', message: `must be one of: ${cities.join(', ')}` });
  }
  const provider = read(read(data, 'payment'), 'provider');
  if (typeof provider !== 'string' || !providers.includes(provider)) {
    errors.push({ path: 'payment.provider', message: `must be one of: ${providers.join(', ')}` });
  }
  if (
    errors.length > 0 ||
    typeof quantity !== 'number' ||
    typeof city !== 'string' ||
    typeof provider !== 'string'
  ) {
    return { ok: false, status: 422, body: { error: 'validation_failed', fields: errors } };
  }
  return { ok: true, quantity, city, payment: provider };
}

export type SnippetLanguage = 'curl' | 'fetch' | 'python';

export interface SnippetRequest {
  method: 'GET' | 'POST';
  url: string;
  headers: readonly (readonly [string, string])[];
  body: string;
}

export function snippet(language: SnippetLanguage, request: SnippetRequest): string {
  const headers = request.headers.filter(([name]) => name !== 'User-Agent');
  const hasBody = request.method === 'POST' && request.body !== '';
  if (language === 'curl') {
    return [
      `curl -X ${request.method} '${request.url}' \\`,
      ...headers.map(([name, value]) => `  -H '${name}: ${value}' \\`),
      ...(hasBody ? [`  --data '${request.body.replace(/\s*\n\s*/g, ' ')}'`] : []),
    ]
      .join('\n')
      .replace(/ \\$/, '');
  }
  if (language === 'fetch') {
    return [
      `const response = await fetch('${request.url}', {`,
      `  method: '${request.method}',`,
      '  headers: {',
      ...headers.map(([name, value]) => `    '${name}': '${value}',`),
      '  },',
      ...(hasBody ? [`  body: JSON.stringify(${request.body.replace(/\n/g, '\n  ')}),`] : []),
      '});',
      'const data = await response.json();',
    ].join('\n');
  }
  return [
    'import requests',
    '',
    `response = requests.${request.method.toLowerCase()}(`,
    `    "${request.url}",`,
    '    headers={',
    ...headers.map(([name, value]) => `        "${name}": "${value}",`),
    '    },',
    ...(hasBody ? [`    json=${request.body.replace(/\n/g, '\n    ')},`] : []),
    ')',
    'print(response.json())',
  ].join('\n');
}

export interface LoadPoint {
  t: number;
  rps: number;
  p95: number;
  instances: number;
}

export const LOAD_SECONDS = 10;
export const LOAD_STEP = 0.25;
export const TARGET_RPS = 1000;
const PER_INSTANCE = 180;
const SCALE_LAG = 1;
const MAX_INSTANCES = 8;
const BASE_INSTANCES = 2;

export function loadSeries(): LoadPoint[] {
  const points: LoadPoint[] = [];
  for (let t = 0; t <= LOAD_SECONDS + 1e-9; t += LOAD_STEP) {
    const rps = Math.round(t < 4 ? (TARGET_RPS * t) / 4 : TARGET_RPS - ((t * 37) % 23));
    const demand = Math.ceil(
      Math.max(0, (t < 4 ? (TARGET_RPS * (t - SCALE_LAG)) / 4 : TARGET_RPS) / PER_INSTANCE),
    );
    const instances = Math.min(MAX_INSTANCES, Math.max(BASE_INSTANCES, demand));
    const pressure = rps / (instances * PER_INSTANCE);
    const p95 = Math.round(48 + Math.max(0, pressure - 0.7) * 160 + ((t * 53) % 7));
    points.push({ t: Number(t.toFixed(2)), rps, p95, instances });
  }
  return points;
}

export function summarize(points: readonly LoadPoint[]) {
  const peak = points.reduce((max, point) => Math.max(max, point.p95), 0);
  const last = points.at(-1);
  const requests = Math.round(points.reduce((sum, point) => sum + point.rps * LOAD_STEP, 0));
  return { peakP95: peak, instances: last?.instances ?? BASE_INSTANCES, requests };
}
