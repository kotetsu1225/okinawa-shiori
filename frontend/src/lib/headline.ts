import { daysUntil, isEnded, parseDate } from './date';
import type { Day, Item } from '../types/domain';

// 一覧ページ上部の「大きな数字 + ラベル」に何を出すか。
//   before … 出発前。出発までの日数
//   next   … 旅の最中で、次の予定までのカウントダウン(日 / 時間 / 分)
//   now    … 旅の最中だが、時刻付きの未来の予定が無い
//   ended  … 旅が終わった
export type Headline =
  | { kind: 'before'; value: number }
  | { kind: 'next'; value: number; unit: 'day' | 'hour' | 'minute'; minutes: number; title: string }
  | { kind: 'now' }
  | { kind: 'ended' };

// 予定の開始時刻(ローカル時刻のエポック ms)。時刻未定なら null
export function startAt(dayDate: string, startTime: string): number | null {
  if (!startTime) return null;
  const [h, m] = startTime.split(':').map(Number);
  return parseDate(dayDate).getTime() + h * 3600000 + m * 60000;
}

// 次の予定 = 時刻が入っていて、完了しておらず、いまより後のもののうち最も早いもの。
export function nextTimedItem(days: Day[], items: Item[], now: number): { item: Item; day: Day; at: number } | null {
  const dayById = new Map(days.map((d) => [d.id, d]));
  let best: { item: Item; day: Day; at: number } | null = null;
  for (const it of items) {
    if (it.done) continue;
    const day = dayById.get(it.dayId);
    if (!day) continue;
    const at = startAt(day.date, it.startTime);
    if (at === null || at <= now) continue;
    if (!best || at < best.at) best = { item: it, day, at };
  }
  return best;
}

export function computeHeadline(days: Day[], items: Item[], now: number): Headline {
  if (days.length === 0) return { kind: 'now' };
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const du = daysUntil(first, now);
  if (du > 0) return { kind: 'before', value: du };
  if (isEnded(last, now)) return { kind: 'ended' };

  const next = nextTimedItem(days, items, now);
  if (!next) return { kind: 'now' };

  const title = next.item.title;
  const dayDiff = daysUntil(next.day.date, now);
  if (dayDiff > 0) return { kind: 'next', value: dayDiff, unit: 'day', minutes: 0, title };
  const mins = Math.max(1, Math.ceil((next.at - now) / 60000));
  if (mins < 60) return { kind: 'next', value: mins, unit: 'minute', minutes: 0, title };
  return { kind: 'next', value: Math.floor(mins / 60), unit: 'hour', minutes: mins % 60, title };
}

// カウントアップ演出の目標値
export function headlineTarget(h: Headline): number {
  return h.kind === 'before' || h.kind === 'next' ? h.value : 0;
}

// 表示文字列。count は演出中の数字(null なら 0)
export function headlineText(h: Headline, count: number | null): { text: string; label: string } {
  const n = String(count ?? 0);
  switch (h.kind) {
    case 'before':
      return { text: n, label: '日後に出発' };
    case 'ended':
      return { text: '', label: 'たのしかったね' };
    case 'now':
      return { text: 'Now', label: '旅のまっただなか' };
    case 'next':
      if (h.unit === 'day') return { text: n, label: `日後に ${h.title}` };
      if (h.unit === 'minute') return { text: n, label: `分後に ${h.title}` };
      return { text: n, label: `時間${h.minutes ? `${h.minutes}分` : ''}後に ${h.title}` };
  }
}
