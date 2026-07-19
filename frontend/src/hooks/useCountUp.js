import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 → target once, with an ease-out curve.
 * Dependency-free (requestAnimationFrame). Respects prefers-reduced-motion.
 */
export function useCountUp(target = 0, { duration = 1100, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef();

  useEffect(() => {
    const end = Number(target) || 0;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || duration <= 0) {
      setValue(end);
      return;
    }

    let start;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      if (start === undefined) start = now;
      const p = Math.min((now - start) / duration, 1);
      setValue(end * easeOut(p));
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else setValue(end);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
