import { useEffect, useState, type RefObject } from 'react';

interface InViewOptions {
  amount?: number;
  margin?: string;
  once?: boolean;
}

export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { amount = 0, margin = '0px', once = true }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || (once && inView)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (once) {
          if (!entry.isIntersecting) return;
          setInView(true);
          observer.disconnect();
          return;
        }
        setInView(entry.isIntersecting);
      },
      { threshold: amount, rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, amount, margin, once, inView]);

  return inView;
}
