import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/shared/i18n';
import { useAutoplay, usePrefersReducedMotion } from '@/shared/lib';
import { Desktop } from '@/shared/ui';
import { BOOT_LOG, appendLog, hmrLine } from '../model/devServer';
import { BrowserWindow, type Audit, type Device } from './BrowserWindow';
import { ACCENTS } from '../model/accents';
import { IdeWindow, type TerminalUpdate } from './IdeWindow';

const TYPE_DELAY = 42;
const HMR_DEBOUNCE = 350;

export function HeroStudio() {
  const { t } = useI18n();
  const copy = t.build;
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const [headline, setHeadline] = useState(copy.demo.headline);
  const [cta, setCta] = useState(copy.demo.cta);
  const [accent, setAccent] = useState<string>(ACCENTS[0]);
  const [device, setDevice] = useState<Device>('desktop');
  const [audit, setAudit] = useState<Audit>('idle');
  const [typing, setTyping] = useState(false);
  const [log, setLog] = useState<readonly string[]>(BOOT_LOG);
  const mounted = useRef(false);

  const { schedule, interrupt, touched } = useAutoplay(
    rootRef,
    (later) => {
      if (reduceMotion) {
        later(() => setAudit('done'), 0);
        return;
      }
      const target = copy.demo.headline;
      later(() => {
        setTyping(true);
        setHeadline('');
      }, 300);
      for (let index = 1; index <= target.length; index += 1) {
        later(() => setHeadline(target.slice(0, index)), 500 + index * TYPE_DELAY);
      }
      const typed = 500 + target.length * TYPE_DELAY;
      later(() => setTyping(false), typed + 200);
      later(() => setAudit('running'), typed + 900);
      later(() => setAudit('done'), typed + 2000);
    },
    { amount: 0.3 },
  );

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = window.setTimeout(() => {
      setLog((current) => appendLog(current, hmrLine(new Date())));
    }, HMR_DEBOUNCE);
    return () => window.clearTimeout(id);
  }, [headline, cta, accent]);

  const takeOver = () => {
    interrupt();
    if (!typing) return;
    setTyping(false);
    setHeadline(copy.demo.headline);
  };

  const runAudit = () => {
    takeOver();
    setAudit('running');
    schedule(() => setAudit('done'), reduceMotion ? 0 : 1100);
  };

  const browse = () => {
    takeOver();
    if (audit === 'done') return;
    setAudit('running');
    schedule(() => setAudit('done'), reduceMotion ? 0 : 1100);
  };

  const terminal = (update: TerminalUpdate) => {
    takeOver();
    setLog((current) =>
      update === 'clear'
        ? []
        : update.reduce<readonly string[]>((lines, line) => appendLog(lines, line), current),
    );
  };

  return (
    <div ref={rootRef}>
      <Desktop>
        <div className="flex flex-col gap-4 lg:relative lg:block lg:h-[44rem]">
          <div className="order-2 h-[36rem] sm:h-[38rem] lg:absolute lg:top-0 lg:left-0 lg:h-[40rem] lg:w-[61%]">
            <IdeWindow
              title={copy.window}
              headline={headline}
              cta={cta}
              accent={accent}
              typing={typing}
              log={log}
              accentNames={copy.accentNames}
              accentLabel={copy.accentLabel}
              hints={copy.hints}
              showHints={!touched}
              initial={{ headline: copy.demo.headline, cta: copy.demo.cta, accent: ACCENTS[0] }}
              onTerminal={terminal}
              onHeadline={setHeadline}
              onCta={setCta}
              onAccent={(value) => {
                takeOver();
                setAccent(value);
              }}
              onFocus={takeOver}
            />
          </div>
          <div className="order-1 h-[34rem] lg:absolute lg:right-0 lg:bottom-0 lg:z-10 lg:h-[35rem] lg:w-[40%]">
            <BrowserWindow
              copy={copy}
              headline={headline}
              cta={cta}
              accent={accent}
              device={device}
              audit={audit}
              onDevice={(value) => {
                takeOver();
                setDevice(value);
              }}
              onAudit={runAudit}
              onInteract={browse}
            />
          </div>
        </div>
      </Desktop>
    </div>
  );
}
