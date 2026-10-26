import { useEffect, useState, type RefObject } from 'react';

interface InViewOptions {
  amount?: number;
  margin?: string;
}

export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { amount = 0, margin = '0px' }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: amount, rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, amount, margin, inView]);

  return inView;
}
