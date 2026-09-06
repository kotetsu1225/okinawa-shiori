import { createContext, useContext } from 'react';
import type { ItineraryStore } from '../hooks/useItinerary';
import type { SheetStore } from '../hooks/useSheet';
import type { Headline } from '../lib/headline';

export type Screen = 'overview' | 'day';

// ページの container が共有する状態。App(root container)が組み立てる。
// 並べ替え(dnd-kit)はページごとに DndContext を張るので、ここには持たない。
export type AppContextValue = {
  itinerary: ItineraryStore;
  sheet: SheetStore;
  session: { name: string; logout: () => void };
  nav: {
    screen: Screen;
    dayIdx: number;
    goOverview: () => void;
    goDay: () => void;
    openDay: (index: number) => void; // 一覧 → 日程(その日)
    selectDay: (index: number) => void; // 日程ページ内の DAY 切替
  };
  ui: {
    expandedId: string | null;
    confirmId: string | null;
    setExpandedId: (id: string | null) => void;
    setConfirmId: (id: string | null) => void;
  };
  // 一覧上部の見出し(出発までの日数 / 次の予定までのカウントダウン)と、その数字の演出値
  headline: Headline;
  count: number | null;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const v = useContext(AppContext);
  if (!v) throw new Error('AppContext is not provided');
  return v;
}
