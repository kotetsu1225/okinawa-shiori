// 'YYYY-MM-DD' をローカル時刻の深夜として解釈する。
// new Date('YYYY-MM-DD') は UTC 解釈になり、JST では前日にずれるので使わない。
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

// 'M/D (曜)'
export function fmtDate(s: string): string {
  const d = parseDate(s);
  return `${d.getMonth() + 1}/${d.getDate()} (${'日月火水木金土'[d.getDay()]})`;
}

// 今日から s までの日数(過去なら負)。now は基準時刻(省略時は現在)
export function daysUntil(s: string, now: number = Date.now()): number {
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  return Math.round((parseDate(s).getTime() - t.getTime()) / 86400000);
}

// 最終日の翌日 0:00 を過ぎていれば「終わった」
export function isEnded(lastDate: string, now: number = Date.now()): boolean {
  return now > parseDate(lastDate).getTime() + 86400000;
}
