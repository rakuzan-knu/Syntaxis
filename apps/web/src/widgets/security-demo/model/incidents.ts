import { ATTACKS, type AttackId } from './attacks';

export interface Incident {
  id: number;
  attack: AttackId;
  blocked: boolean;
  guard: string;
  ip: string;
  time: string;
}

export const MAX_INCIDENTS = 6;

export function attackerIp(seed: number): string {
  const part = (factor: number, offset: number) => ((seed * factor + offset) % 223) + 11;
  return `${part(37, 74)}.${part(59, 3)}.${part(83, 121)}.${part(97, 40)}`;
}

export function clock(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function recordIncident(
  incidents: readonly Incident[],
  attack: AttackId,
  blocked: boolean,
  id: number,
  date: Date,
): Incident[] {
  const guard = ATTACKS.find((item) => item.id === attack)?.guard ?? '';
  return [
    { id, attack, blocked, guard, ip: attackerIp(id), time: clock(date) },
    ...incidents,
  ].slice(0, MAX_INCIDENTS);
}

export function incidentStats(incidents: readonly Incident[]): {
  blocked: number;
  through: number;
} {
  const blocked = incidents.filter((incident) => incident.blocked).length;
  return { blocked, through: incidents.length - blocked };
}
