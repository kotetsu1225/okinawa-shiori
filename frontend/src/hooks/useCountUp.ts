import { useEffect, useRef, useState } from 'react';

// 0 から target まで 1.1 秒でイージングしながら数える。active が false の間は null。
// 演出は active になった最初の 1 回だけ。その後 target が変わったら(カウントダウンの更新など)数字を直接置き換える。
export function useCountUp(target: number, active: boolean): number | null {
  const [count, setCount] = useState<number | null>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!active) {
      animated.current = false;
      setCount(null);
      return;
    }
    const goal = Math.max(0, target);
    if (animated.current) {
      setCount(goal);
      return;
    }
    animated.current = true;
    const t0 = performance.now();
    const dur = 1100;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(goal * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);

  return count;
}
