import { useEffect, useState } from 'react';

// 一定間隔で更新される「いま」(エポック ms)。カウントダウンの再計算に使う。
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
