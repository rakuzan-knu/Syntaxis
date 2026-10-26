import { BellRing, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { fillTemplate } from '@/shared/lib';
import { incidentStats, type Incident } from '../model/incidents';

interface IncidentLogProps {
  copy: Dictionary['security']['incidents'];
  incidents: readonly Incident[];
  attackName: (incident: Incident) => string;
  guardName: (guard: string) => string;
}

export function IncidentLog({ copy, incidents, attackName, guardName }: IncidentLogProps) {
  const stats = incidentStats(incidents);
  return (
    <div className="text-[0.75rem]">
      <div className="grid grid-cols-2 border-b border-win-line">
        <p className="border-r border-win-line px-4 py-3">
          <span className="block font-mono text-[1.25rem] font-semibold text-ok tabular-nums">
            {stats.blocked}
          </span>
          <span className="text-win-muted">{copy.blocked}</span>
        </p>
        <p className="px-4 py-3">
          <span
            className={`block font-mono text-[1.25rem] font-semibold tabular-nums ${stats.through > 0 ? 'text-bad' : 'text-win-muted'}`}
          >
            {stats.through}
          </span>
          <span className="text-win-muted">{copy.through}</span>
        </p>
      </div>
      {incidents.length === 0 ? (
        <p className="px-4 py-5 text-center text-win-muted">{copy.empty}</p>
      ) : (
        <ol aria-live="polite" className="scroll-area max-h-64 lg:max-h-36">
          {incidents.map((incident) => (
            <li
              key={incident.id}
              className="log-line flex gap-2.5 border-b border-win-line/70 px-4 py-2 last:border-b-0"
            >
              {incident.blocked ? (
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ok" />
              ) : (
                <ShieldAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-bad" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium text-win-text">{attackName(incident)}</span>
                  <span className="shrink-0 font-mono text-[0.6875rem] text-win-muted">
                    {incident.time}
                  </span>
                </span>
                <span className="block font-mono text-[0.6875rem] text-win-muted">
                  {incident.ip} ·{' '}
                  <span className={incident.blocked ? 'text-ok' : 'text-bad'}>
                    {incident.blocked
                      ? fillTemplate(copy.stoppedBy, { guard: guardName(incident.guard) })
                      : copy.passed}
                  </span>
                </span>
                {incident.blocked ? null : (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] text-warn">
                    <BellRing aria-hidden="true" className="size-3" />
                    {copy.alert}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
