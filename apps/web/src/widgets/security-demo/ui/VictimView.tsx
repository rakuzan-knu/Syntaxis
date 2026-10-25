import { Camera, Gift, Lock, LockOpen, ShieldCheck, Skull, Wifi } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Dictionary } from '@/shared/i18n';
import type { AttackId } from '../model/attacks';

interface VictimViewProps {
  copy: Dictionary['security']['victim'];
  attack: AttackId | null;
  blocked: boolean;
  run: number;
  brand: string;
  pay: string;
  children?: ReactNode;
}

function Address({ secure }: { secure: boolean }) {
  return (
    <span
      className={`mx-auto flex items-center gap-1.5 rounded-full px-3 py-0.5 ${secure ? 'bg-win' : 'bg-bad/10 text-bad'}`}
    >
      {secure ? (
        <Lock aria-hidden="true" className="size-2.5" />
      ) : (
        <LockOpen aria-hidden="true" className="size-2.5" />
      )}
      {secure ? 'https://' : 'http://'}zerno.preview.example
    </span>
  );
}

function Scene({ copy, attack, blocked, brand, pay }: Omit<VictimViewProps, 'run' | 'children'>) {
  if (attack === 'xss') {
    return (
      <div className="flex flex-col gap-2 p-4 text-[0.75rem]">
        <p className="font-semibold">{copy.review}</p>
        <p className="rounded-lg bg-white p-2.5 font-mono text-[0.6875rem] break-all shadow-sm">
          {copy.reviewText}
        </p>
        {blocked ? null : (
          <p className="ink-in flex items-center gap-2 rounded-lg bg-bad px-3 py-2 font-medium text-white">
            <Skull aria-hidden="true" className="size-4 shrink-0" />
            {copy.stolen}: session=8f2c…
          </p>
        )}
      </div>
    );
  }
  if (attack === 'clickjack') {
    return blocked ? (
      <div className="grid h-full place-items-center p-4 text-center text-[0.75rem] text-black/60">
        <p className="rounded-lg border border-dashed border-black/20 p-4">{copy.refused}</p>
      </div>
    ) : (
      <div className="relative h-full overflow-hidden bg-[#ffe14d] p-4">
        <p className="flex items-center gap-2 text-[1rem] font-bold text-[#7a1fa2]">
          <Gift aria-hidden="true" className="size-5" />
          {copy.prize}
        </p>
        <div className="absolute inset-x-6 top-14 bottom-4 rounded-lg bg-white/40 p-3 text-[0.6875rem] opacity-60 shadow">
          <p className="font-semibold">{brand}</p>
          <span className="mt-6 block rounded-full bg-[#2f3bff] py-1.5 text-center text-white">
            {pay}
          </span>
        </div>
      </div>
    );
  }
  if (attack === 'downgrade') {
    return (
      <div className="flex flex-col gap-2.5 p-4 text-[0.75rem]">
        <p className="flex items-center gap-1.5 text-black/60">
          <Wifi aria-hidden="true" className="size-3.5" /> Cafe_Free_WiFi
        </p>
        <label className="block text-black/60">
          {copy.password}
          <span className="mt-1 block rounded-md border border-black/15 bg-white px-2 py-1.5 tracking-widest">
            ••••••••
          </span>
        </label>
        {blocked ? null : (
          <p className="ink-in rounded-lg bg-[#1d2027] p-2.5 font-mono text-[0.6875rem] text-[#ff8f8f]">
            {copy.intercepted} password=coffee2026
          </p>
        )}
      </div>
    );
  }
  if (attack === 'camera') {
    return (
      <div className="grid h-full place-items-center p-4">
        {blocked ? null : (
          <div className="ink-in w-full max-w-[15rem] rounded-xl bg-white p-3 text-[0.75rem] shadow-lg">
            <p className="flex items-start gap-2">
              <Camera aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {copy.permission}
            </p>
            <span className="mt-3 flex justify-end gap-2">
              <span className="rounded-full border border-black/15 px-3 py-1">{copy.deny}</span>
              <span className="rounded-full bg-[#2f3bff] px-3 py-1 text-white">{copy.allow}</span>
            </span>
          </div>
        )}
      </div>
    );
  }
  return (
    <p className="grid h-full place-items-center p-6 text-center text-[0.75rem] text-black/50">
      {copy.idle}
    </p>
  );
}

export function VictimView({ copy, attack, blocked, run, brand, pay, children }: VictimViewProps) {
  const secure = attack !== 'downgrade' || blocked;
  return (
    <div data-tone="light" className="window relative overflow-hidden">
      <div className="flex h-9 items-center gap-2 border-b border-win-line bg-win-raised px-3 text-[0.6875rem] text-win-muted">
        <span aria-hidden="true" className="flex gap-1">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </span>
        {attack === 'clickjack' && !blocked ? (
          <span className="mx-auto rounded-full bg-bad/10 px-3 py-0.5 text-bad">
            https://win-iphone.evil.example
          </span>
        ) : (
          <Address secure={secure} />
        )}
      </div>
      {children}
      <p className="border-b border-win-line px-3 py-1.5 text-[0.6875rem] font-semibold text-win-muted">
        {copy.title}
      </p>
      <div key={`${attack ?? 'idle'}-${run}`} className="relative h-48 bg-[#f7f4ef] text-[#1d1a17]">
        <Scene copy={copy} attack={attack} blocked={blocked} brand={brand} pay={pay} />
        {attack && blocked ? (
          <span className="ink-in absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-ok px-3 py-1 text-[0.6875rem] font-semibold text-white">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            {copy.blocked}
          </span>
        ) : null}
      </div>
    </div>
  );
}
