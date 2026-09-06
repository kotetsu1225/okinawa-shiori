import { useCallback, useState } from 'react';
import type { Item } from '../types/domain';

// 下から出るシートの状態。予定の追加 / 編集、旅の設定の 3 モード。

export type ItemSheetState = {
  mode: 'add' | 'edit';
  id?: string;
  dayId: string;
  startTime: string;
  title: string;
  description: string;
  url: string;
};

// 旅の設定で編集中の日。id が無いものは保存時に新規作成される。
export type DayDraft = { id?: string; date: string; title: string };

export type TripSheetState = {
  mode: 'trip';
  title: string;
  days: DayDraft[];
};

export type SheetState = ItemSheetState | TripSheetState;

export function useSheet() {
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const openAdd = useCallback((dayId: string) => {
    setSheet({ mode: 'add', dayId, startTime: '', title: '', description: '', url: '' });
  }, []);

  const openEdit = useCallback((it: Item) => {
    setSheet({
      mode: 'edit',
      id: it.id,
      dayId: it.dayId,
      startTime: it.startTime,
      title: it.title,
      description: it.description,
      url: it.url,
    });
  }, []);

  const openTrip = useCallback((title: string, days: DayDraft[]) => {
    setSheet({ mode: 'trip', title, days: days.map((d) => ({ ...d })) });
  }, []);

  const close = useCallback(() => setSheet(null), []);

  const patchItemSheet = useCallback((patch: Partial<ItemSheetState>) => {
    setSheet((s) => (s && s.mode !== 'trip' ? { ...s, ...patch } : s));
  }, []);

  const patchTripSheet = useCallback((update: (s: TripSheetState) => TripSheetState) => {
    setSheet((s) => (s && s.mode === 'trip' ? update(s) : s));
  }, []);

  return { sheet, openAdd, openEdit, openTrip, close, patchItemSheet, patchTripSheet };
}

export type SheetStore = ReturnType<typeof useSheet>;
