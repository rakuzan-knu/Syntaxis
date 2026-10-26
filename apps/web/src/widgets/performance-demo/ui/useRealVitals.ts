import { useEffect, useState } from 'react';
import { addShift, totalSize, waterfall, type ResourceRow } from '../model/realVitals';

export interface RealVitals {
  ttfb: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number;
  inp: number | null;
  resources: readonly ResourceRow[];
  count: number;
  bytes: number;
}

const EMPTY: RealVitals = {
  ttfb: null,
  fcp: null,
  lcp: null,
  cls: 0,
  inp: null,
  resources: [],
  count: 0,
  bytes: 0,
};

function supported(type: string): boolean {
  return (
    typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes.includes(type)
  );
}

export function useRealVitals(active: boolean): RealVitals {
  const [vitals, setVitals] = useState<RealVitals>(EMPTY);

  useEffect(() => {
    if (!active || typeof performance === 'undefined') return;
    const observers: PerformanceObserver[] = [];
    const watch = (
      type: string,
      onEntries: (entries: PerformanceEntryList) => void,
      extra = {},
    ) => {
      if (!supported(type)) return;
      const observer = new PerformanceObserver((list) => onEntries(list.getEntries()));
      observer.observe({ type, buffered: true, ...extra });
      observers.push(observer);
    };

    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance
      .getEntriesByType('resource')
      .filter(
        (entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming,
      );
    const frame = window.requestAnimationFrame(() =>
      setVitals((current) => ({
        ...current,
        ttfb:
          navigation instanceof PerformanceNavigationTiming
            ? Math.round(navigation.responseStart)
            : current.ttfb,
        resources: waterfall(resources),
        count: resources.length,
        bytes: totalSize(resources),
      })),
    );

    watch('paint', (entries) => {
      const paint = entries.find((entry) => entry.name === 'first-contentful-paint');
      if (paint) setVitals((current) => ({ ...current, fcp: Math.round(paint.startTime) }));
    });
    watch('largest-contentful-paint', (entries) => {
      const last = entries.at(-1);
      if (last) setVitals((current) => ({ ...current, lcp: Math.round(last.startTime) }));
    });
    watch('layout-shift', (entries) => {
      setVitals((current) => ({
        ...current,
        cls: entries.reduce((sum, entry) => {
          const value = Reflect.get(entry, 'value');
          const input = Reflect.get(entry, 'hadRecentInput');
          return typeof value === 'number' ? addShift(sum, value, input === true) : sum;
        }, current.cls),
      }));
    });
    watch(
      'event',
      (entries) => {
        const longest = entries.reduce((max, entry) => Math.max(max, entry.duration), 0);
        if (longest > 0)
          setVitals((current) => ({
            ...current,
            inp: Math.max(current.inp ?? 0, Math.round(longest)),
          }));
      },
      { durationThreshold: 16 },
    );

    return () => {
      window.cancelAnimationFrame(frame);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [active]);

  return vitals;
}
