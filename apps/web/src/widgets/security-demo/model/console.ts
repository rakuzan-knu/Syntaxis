export type ConsoleLevel = 'error' | 'warning' | 'info';

export interface ConsoleMessage {
  level: ConsoleLevel;
  text: string;
  source: string;
}

export interface NetworkRow {
  name: string;
  status: string;
  type: string;
  size: string;
  time: string;
  blocked?: boolean;
}

const TRACKER = 'https://evil.example/tracker.js';

export function consoleMessages(enabled: readonly string[]): ConsoleMessage[] {
  const on = (id: string) => enabled.includes(id);
  const messages: ConsoleMessage[] = [];

  if (on('csp')) {
    messages.push({
      level: 'error',
      text: `Refused to load the script '${TRACKER}' because it violates the following Content Security Policy directive: "script-src 'self'".`,
      source: '(index):1',
    });
  } else {
    messages.push({
      level: 'warning',
      text: `Script ${TRACKER} executed with access to document.cookie.`,
      source: 'tracker.js:1',
    });
  }
  if (!on('frame')) {
    messages.push({
      level: 'warning',
      text: 'Page can be embedded in a cross-origin <iframe> (clickjacking risk).',
      source: 'security',
    });
  }
  if (!on('hsts')) {
    messages.push({
      level: 'warning',
      text: 'No Strict-Transport-Security header: first visit can be downgraded to HTTP.',
      source: 'security',
    });
  }
  if (!on('permissions')) {
    messages.push({
      level: 'info',
      text: 'Third-party frames may request camera, microphone and geolocation.',
      source: 'security',
    });
  }
  return messages;
}

export function networkRows(enabled: readonly string[]): NetworkRow[] {
  const blocked = enabled.includes('csp');
  return [
    {
      name: 'zerno.preview.example',
      status: '200',
      type: 'document',
      size: '6.2 kB',
      time: '84 ms',
    },
    { name: 'index-BLMw.js', status: '200', type: 'script', size: '86.7 kB', time: '112 ms' },
    { name: 'style-Dg63.css', status: '200', type: 'stylesheet', size: '9.3 kB', time: '41 ms' },
    { name: 'geologica-wght.woff2', status: '200', type: 'font', size: '24.9 kB', time: '58 ms' },
    blocked
      ? {
          name: 'tracker.js',
          status: '(blocked:csp)',
          type: 'script',
          size: '0 B',
          time: '—',
          blocked: true,
        }
      : { name: 'tracker.js', status: '200', type: 'script', size: '3.1 kB', time: '212 ms' },
    { name: 'og.png', status: '200', type: 'png', size: '43.0 kB', time: '66 ms' },
  ];
}
