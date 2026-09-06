import { useCallback, useEffect, useMemo, useState } from 'react';
import * as tripApi from '../api/trip';
import * as daysApi from '../api/days';
import * as itemsApi from '../api/items';
import type { Day, Item, ItemInput, Trip } from '../types/domain';

export type Itinerary = {
  trip: Trip | null;
  days: Day[]; // date 昇順
  items: Item[];
  loaded: boolean;
  loadError: string | null;
};

// 旅程(trip / days / items)の読み込みと、カードの CRUD。
// 日付と旅のタイトルの保存は useTripSettings 側(features/TripSheet)で行う。
export function useItinerary() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const [t, ds, is] = await Promise.all([tripApi.getTrip(), daysApi.listDays(), itemsApi.listItems()]);
      setTrip(t);
      setDays(ds);
      setItems(is);
      setLoadError(null);
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoaded(true);
    }
  }, []);

  const refreshItems = useCallback(async () => {
    setItems(await itemsApi.listItems());
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // ---- items
  const createItem = useCallback(
    async (input: ItemInput & { dayId: string; title: string }) => {
      await itemsApi.createItem(input);
      await refreshItems();
    },
    [refreshItems],
  );

  const updateItem = useCallback(
    async (id: string, patch: ItemInput) => {
      await itemsApi.patchItem(id, patch);
      await refreshItems();
    },
    [refreshItems],
  );

  const removeItem = useCallback(
    async (id: string) => {
      await itemsApi.deleteItem(id);
      await refreshItems();
    },
    [refreshItems],
  );

  // 並べ替え確定。動いた 1 枚だけを PATCH し、他のカードの位置はサーバが振り直す(B6)。
  // optimistic には画面上の並びから計算した位置を先に反映し、応答後にサーバの結果で置き換える。
  const moveItem = useCallback(
    async (id: string, dayId: string, position: number, optimistic: Item[]) => {
      setItems(optimistic);
      try {
        await itemsApi.patchItem(id, { dayId, position });
      } finally {
        await refreshItems();
      }
    },
    [refreshItems],
  );

  const itinerary: Itinerary = useMemo(
    () => ({ trip, days, items, loaded, loadError }),
    [trip, days, items, loaded, loadError],
  );

  return {
    ...itinerary,
    setTrip,
    setDays,
    refreshAll,
    refreshItems,
    createItem,
    updateItem,
    removeItem,
    moveItem,
  };
}

export type ItineraryStore = ReturnType<typeof useItinerary>;

// 日ごとのカードを position 順で返す
export function itemsOfDay(items: Item[], dayId: string): Item[] {
  return items.filter((x) => x.dayId === dayId).sort((a, b) => a.position - b.position);
}
