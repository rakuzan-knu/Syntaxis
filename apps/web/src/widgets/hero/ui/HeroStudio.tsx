import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/shared/i18n';
import { useAutoplay, useDemoCommands, usePrefersReducedMotion } from '@/shared/lib';
import { DemoPlayer, Desktop, DesktopWindow, GuideCursor } from '@/shared/ui';
import { BOOT_LOG, appendLog, hmrLine } from '../model/devServer';
import { BrowserWindow, type Audit, type Device } from './BrowserWindow';
import { ACCENTS } from '../model/accents';
import { IdeWindow, type TerminalUpdate } from './IdeWindow';

const TYPE_DELAY = 42;
const HMR_DEBOUNCE = 350;
const TYPE_START = 500;
const TYPED_PREFIX = 8;

function typedUntil(headline: string): number {
  return TYPE_START + Math.min(TYPED_PREFIX, headline.length) * TYPE_DELAY;
}

function heroChapters(headline: string): number[] {
  const accepted = typedUntil(headline) + 500;
  const color = accepted + 900;
  const consultant = color + 2200;
  const purchase = consultant + 4300;
  const audit = purchase + 4600;
  return [0, color, consultant, purchase, audit];
}

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
  const [generation, setGeneration] = useState(0);
  const mounted = useRef(false);
  const [chapters] = useState(() => heroChapters(copy.demo.headline));

  const reset = () => {
    setHeadline(copy.demo.headline);
    setCta(copy.demo.cta);
    setAccent(ACCENTS[0]);
    setDevice('desktop');
    setAudit('idle');
    setTyping(false);
    setGeneration((value) => value + 1);
  };

  const { schedule, interrupt, touched, player } = useAutoplay(
    rootRef,
    (later) => {
      if (reduceMotion) {
        later(() => setAudit('done'), 0);
        return;
      }
      const [, color = 0, consultant = 0, purchase = 0, audit = 0] = chapters;
      const target = copy.demo.headline;
      const prefix = Math.min(TYPED_PREFIX, target.length);
      later(
        () => {
          setTyping(true);
          setHeadline('');
        },
        300,
        { target: '[data-guide="headline"]', click: true },
      );
      for (let index = 1; index <= prefix; index += 1) {
        later(() => setHeadline(target.slice(0, index)), TYPE_START + index * TYPE_DELAY);
      }
      later(() => setTyping(false), typedUntil(target) + 500, {
        target: '[data-guide="completion"]',
        press: true,
      });
      later(() => undefined, color, { target: '[data-guide="accent"]', press: true });
      later(() => undefined, color + 1100, { target: '[data-guide="accent-1"]', press: true });
      later(() => undefined, consultant, { target: '[data-guide="consultant"]', press: true });
      later(() => undefined, consultant + 900, {
        target: '[data-guide="consultant-chip"]',
        press: true,
      });
      later(() => undefined, consultant + 2900, {
        target: '[data-guide="consultant-add"]',
        press: true,
      });
      later(() => undefined, purchase, { target: '[data-guide="consultant-cart"]', press: true });
      later(() => undefined, purchase + 1300, { target: '[data-guide="checkout"]', press: true });
      later(() => undefined, purchase + 2400, {
        target: '[data-guide="checkout-name"]',
        value: copy.demo.checkout.namePlaceholder,
        click: true,
      });
      later(() => undefined, purchase + 3300, {
        target: '[data-guide="place-order"]',
        press: true,
      });
      later(() => undefined, audit, { target: '[data-guide="audit"]', press: true });
    },
    { reset, chapters },
  );

  useDemoCommands('hero', player);

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
    <div>
      <div ref={rootRef} className="relative">
        <GuideCursor cursor={player.cursor} name={t.ui.player.guide} />
        <Desktop>
          <div className="flex flex-col gap-4 lg:relative lg:block lg:h-full">
            <DesktopWindow
              id="ide"
              title={copy.window}
              className="order-2 h-[36rem] sm:h-[38rem] lg:absolute lg:top-0 lg:left-0 lg:h-[91%] lg:w-[61%]"
            >
              <IdeWindow
                key={`ide-${generation}`}
                title={copy.window}
                headline={headline}
                cta={cta}
                accent={accent}
                typing={typing}
                log={log}
                accentNames={copy.accentNames}
                accentLabel={copy.accentLabel}
                hints={copy.hints}
                suggestions={[copy.demo.headline, ...copy.suggestions]}
                acceptLabel={copy.acceptSuggestion}
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
            </DesktopWindow>
            <DesktopWindow
              id="browser"
              title={copy.demo.brand}
              className="order-1 h-[38rem] lg:absolute lg:right-0 lg:bottom-0 lg:h-[80%] lg:w-[40%]"
            >
              <BrowserWindow
                key={`browser-${generation}`}
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
                schedule={schedule}
              />
            </DesktopWindow>
          </div>
        </Desktop>
      </div>
      <DemoPlayer player={player} labels={copy.chapters} className="mt-5" />
    </div>
  );
}
