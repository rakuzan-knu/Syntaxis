import { Suspense, use, useEffect, useRef, useState, type ComponentType } from 'react';
import { useInView } from './useInView';

const HYDRATE_MARGIN = '600px 0px';

const preloads = new Set<() => Promise<void>>();

export async function preloadDeferred(): Promise<void> {
  await Promise.all([...preloads].map((preload) => preload()));
}

interface Gate {
  promise: Promise<void>;
  open: () => void;
}

function createGate(): Gate {
  let open = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

export function deferred(load: () => Promise<ComponentType>): ComponentType {
  let Loaded: ComponentType | null = null;
  let pending: Promise<void> | null = null;

  const preload = () => {
    pending ??= load().then((component) => {
      Loaded = component;
    });
    return pending;
  };
  preloads.add(preload);

  function Content({ gate }: { gate: Promise<void> }) {
    if (!Loaded) use(gate);
    return Loaded ? <Loaded /> : null;
  }

  return function Deferred() {
    const ref = useRef<HTMLDivElement>(null);
    const [gate] = useState(createGate);
    const inView = useInView(ref, { margin: HYDRATE_MARGIN });

    useEffect(() => {
      if (inView) void preload().then(gate.open);
    }, [inView, gate]);

    return (
      <div ref={ref}>
        <Suspense fallback={null}>
          <Content gate={gate.promise} />
        </Suspense>
      </div>
    );
  };
}
