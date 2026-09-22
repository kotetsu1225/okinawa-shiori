import { useCallback, useMemo, useState } from 'react';
import { useAppContext } from '../../app/AppContext';
import { ApiError } from '../../api/client';
import * as daysApi from '../../api/days';
import * as tripApi from '../../api/trip';
import type { DayDraft, TripSheetState } from '../../hooks/useSheet';
import { addDays, fmtDate, toDateString } from '../../lib/date';
import { TripSheet, type TripSheetDayRow } from './presenter';

type Props = { state: TripSheetState };

// 保存を途中で止めて確認を求めるための例外(day_has_items、B9)
class NeedsConfirm {
  constructor(
    readonly dayId: string,
    readonly n: number,
    readonly date: string,
    readonly count: number,
  ) {}
}

type PendingDelete = { dayId: string; n: number; date: string; count: number };

function messageOf(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'date_conflict':
        return '同じ日付が 2 つあります';
      case 'last_day':
        return '日は最低 1 日必要です';
      case 'invalid':
        return e.message;
      default:
        return `保存できませんでした(${e.message})`;
    }
  }
  return e instanceof Error ? e.message : '保存できませんでした';
}

export function TripSheetContainer({ state: sh }: Props) {
  const { itinerary, sheet } = useAppContext();
  const { trip, tripSlug, days, refreshAll } = itinerary;
  const { patchTripSheet, close } = sheet;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingDelete | null>(null);
  // 「まとめて消す」を了承した日。保存を再開したとき withItems=true で消す
  const [confirmed, setConfirmed] = useState<Set<string>>(() => new Set());

  const dates = sh.days.map((d) => d.date);
  const canSave = !!sh.title.trim() && sh.days.length > 0 && dates.every(Boolean) && new Set(dates).size === dates.length;

  // ---- 入力
  const updateDay = useCallback(
    (i: number, patch: Partial<DayDraft>) =>
      patchTripSheet((s) => ({ ...s, days: s.days.map((x, j) => (j === i ? { ...x, ...patch } : x)) })),
    [patchTripSheet],
  );
  const removeDay = useCallback(
    (i: number) => patchTripSheet((s) => ({ ...s, days: s.days.filter((_, j) => j !== i) })),
    [patchTripSheet],
  );
  const addDay = useCallback(
    () =>
      patchTripSheet((s) => {
        const last = s.days[s.days.length - 1]?.date;
        const date = last ? addDays(last, 1) : toDateString(new Date());
        return { ...s, days: [...s.days, { date, title: '' }] };
      }),
    [patchTripSheet],
  );

  // ---- 保存
  // trip の title は PATCH、days は「消えた日を DELETE → 残った日を PATCH → 新しい日を POST」。
  // 日付の入れ替えなどで一時的に date_conflict / last_day になる操作は後回しにして、進みが無くなるまで繰り返す。
  const save = useCallback(
    async (confirmedIds: Set<string>) => {
      if (!trip || !canSave) return;
      setBusy(true);
      setError('');
      setPending(null);
      try {
        const title = sh.title.trim();
        if (title !== trip.title) await tripApi.patchTrip(tripSlug, { title });

        const keep = new Set(sh.days.map((d) => d.id).filter((id): id is string => !!id));
        type Op = () => Promise<void>;
        const ops: Op[] = [];

        days.forEach((d, i) => {
          if (keep.has(d.id)) return;
          ops.push(async () => {
            try {
              await daysApi.deleteDay(tripSlug, d.id, confirmedIds.has(d.id));
            } catch (e) {
              if (e instanceof ApiError && e.code === 'day_has_items') throw new NeedsConfirm(d.id, i + 1, d.date, e.itemCount ?? 0);
              if (e instanceof ApiError && e.code === 'not_found') return; // 確認後の再開で、もう消えている
              throw e;
            }
          });
        });
        for (const d of sh.days) {
          if (d.id) {
            const prev = days.find((x) => x.id === d.id);
            if (!prev) continue;
            const patch: { date?: string; title?: string } = {};
            if (prev.date !== d.date) patch.date = d.date;
            if (prev.title !== d.title) patch.title = d.title;
            if (Object.keys(patch).length) {
              const id = d.id;
              ops.push(async () => {
                await daysApi.patchDay(tripSlug, id, patch);
              });
            }
          } else {
            ops.push(async () => {
              await daysApi.createDay(tripSlug, { date: d.date, title: d.title });
            });
          }
        }

        let queue = ops;
        while (queue.length) {
          const retry: Op[] = [];
          let lastErr: unknown = null;
          for (const op of queue) {
            try {
              await op();
            } catch (e) {
              if (e instanceof ApiError && (e.code === 'date_conflict' || e.code === 'last_day')) {
                retry.push(op);
                lastErr = e;
              } else throw e;
            }
          }
          if (retry.length === queue.length) throw lastErr;
          queue = retry;
        }

        await refreshAll();
        close();
      } catch (e) {
        await refreshAll(); // 途中まで適用された分を画面に反映する
        if (e instanceof NeedsConfirm) {
          setPending({ dayId: e.dayId, n: e.n, date: e.date, count: e.count });
        } else {
          console.error(e);
          setError(messageOf(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [trip, tripSlug, days, sh, canSave, refreshAll, close],
  );

  const onSave = useCallback(() => void save(confirmed), [save, confirmed]);

  const onConfirmDelete = useCallback(() => {
    if (!pending) return;
    const next = new Set(confirmed);
    next.add(pending.dayId);
    setConfirmed(next);
    void save(next);
  }, [pending, confirmed, save]);

  const rows: TripSheetDayRow[] = useMemo(
    () =>
      sh.days.map((d, i) => ({
        key: d.id ?? `new-${i}`,
        n: i + 1,
        date: d.date,
        title: d.title,
        removable: sh.days.length > 1,
        onDate: (e) => updateDay(i, { date: e.target.value }),
        onTitle: (e) => updateDay(i, { title: e.target.value }),
        onRemove: () => removeDay(i),
      })),
    [sh.days, updateDay, removeDay],
  );

  return (
    <TripSheet
      title={sh.title}
      canSave={canSave}
      busy={busy}
      error={error}
      days={rows}
      pendingDelete={
        pending
          ? {
              n: pending.n,
              dateText: fmtDate(pending.date),
              count: pending.count,
              onConfirm: onConfirmDelete,
              onCancel: () => setPending(null),
            }
          : null
      }
      onTitle={(e) => patchTripSheet((s) => ({ ...s, title: e.target.value }))}
      onAddDay={addDay}
      onSave={onSave}
      onClose={close}
    />
  );
}
