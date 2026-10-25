export const HERO_FILE = '/src/widgets/hero/Hero.tsx';

export const BOOT_LOG: readonly string[] = [
  '$ pnpm dev',
  '',
  '  VITE v8.3.5  ready in 412 ms',
  '',
  '  ➜  Local:   http://localhost:5173/',
  '  ➜  Network: use --host to expose',
];

const MAX_LINES = 200;

export function clockTime(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function hmrLine(date: Date, file: string = HERO_FILE): string {
  return `${clockTime(date)} [vite] (client) hmr update ${file}`;
}

export function appendLog(log: readonly string[], line: string): string[] {
  return [...log, line].slice(-MAX_LINES);
}
