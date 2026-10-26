import { describe, expect, it } from 'vitest';
import {
  MAX_INCIDENTS,
  attackerIp,
  clock,
  incidentStats,
  recordIncident,
} from '../model/incidents';

const date = new Date(2026, 9, 26, 9, 5, 7);

describe('incident log', () => {
  it('records the newest incident first with its guard', () => {
    const first = recordIncident([], 'xss', true, 1, date);
    const second = recordIncident(first, 'sqli', false, 2, date);
    expect(second.map((incident) => incident.attack)).toEqual(['sqli', 'xss']);
    expect(second[1]).toMatchObject({ guard: 'csp', blocked: true, time: '09:05:07' });
  });

  it('keeps a bounded history', () => {
    let incidents = recordIncident([], 'xss', true, 0, date);
    for (let id = 1; id < 10; id += 1)
      incidents = recordIncident(incidents, 'camera', false, id, date);
    expect(incidents).toHaveLength(MAX_INCIDENTS);
    expect(incidentStats(incidents)).toEqual({ blocked: 0, through: MAX_INCIDENTS });
  });

  it('generates stable, valid attacker addresses', () => {
    expect(attackerIp(3)).toBe(attackerIp(3));
    expect(attackerIp(3)).not.toBe(attackerIp(4));
    expect(
      attackerIp(7)
        .split('.')
        .every((part) => Number(part) > 10 && Number(part) < 234),
    ).toBe(true);
    expect(clock(date)).toBe('09:05:07');
  });
});
