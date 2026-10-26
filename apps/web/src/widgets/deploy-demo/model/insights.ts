export interface DayVisits {
  day: number;
  visitors: number;
}

export function visitsSeries(days = 14): DayVisits[] {
  return Array.from({ length: days }, (_, index) => {
    const weekend = index % 7 === 5 || index % 7 === 6;
    const trend = 820 + index * 38;
    const wave = ((index * 7919) % 97) - 48;
    return { day: index + 1, visitors: Math.round((weekend ? trend * 1.35 : trend) + wave) };
  });
}

export type LogLevel = 'info' | 'warning' | 'error';

export interface RuntimeLog {
  time: string;
  level: LogLevel;
  status: number;
  method: string;
  path: string;
  duration: number;
}

export const RUNTIME_LOGS: readonly RuntimeLog[] = [
  { time: '14:02:11', level: 'info', status: 200, method: 'GET', path: '/', duration: 38 },
  { time: '14:02:12', level: 'info', status: 200, method: 'GET', path: '/catalog', duration: 41 },
  {
    time: '14:02:19',
    level: 'info',
    status: 201,
    method: 'POST',
    path: '/api/orders',
    duration: 96,
  },
  {
    time: '14:02:20',
    level: 'info',
    status: 200,
    method: 'POST',
    path: '/api/webhooks/monobank',
    duration: 44,
  },
  {
    time: '14:02:31',
    level: 'warning',
    status: 404,
    method: 'GET',
    path: '/wp-admin',
    duration: 3,
  },
  {
    time: '14:02:33',
    level: 'warning',
    status: 429,
    method: 'POST',
    path: '/api/login',
    duration: 2,
  },
  {
    time: '14:02:40',
    level: 'info',
    status: 200,
    method: 'GET',
    path: '/product/ethiopia',
    duration: 36,
  },
  {
    time: '14:02:47',
    level: 'error',
    status: 502,
    method: 'POST',
    path: '/api/delivery/quote',
    duration: 3012,
  },
  {
    time: '14:02:48',
    level: 'info',
    status: 200,
    method: 'POST',
    path: '/api/delivery/quote',
    duration: 211,
  },
  { time: '14:02:55', level: 'info', status: 200, method: 'GET', path: '/cart', duration: 29 },
];

export function filterLogs(
  logs: readonly RuntimeLog[],
  query: string,
  onlyProblems: boolean,
): RuntimeLog[] {
  const needle = query.trim().toLowerCase();
  return logs.filter(
    (log) =>
      (!onlyProblems || log.level !== 'info') &&
      (needle === '' || `${log.method} ${log.path} ${log.status}`.toLowerCase().includes(needle)),
  );
}
