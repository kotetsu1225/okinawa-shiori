import { useCallback, useMemo } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useAppContext } from '../app/AppContext';
import { dayIdOfHeader, isHeaderSortableId } from '../lib/sortable';

type Options = {
  // 画面に並んでいる順の sortable ID(カード id と "header:<dayId>" の混在)
  sequence: UniqueIdentifier[];
  // 見出しが無い(日程ページ)ときにカードが属する日
  fallbackDayId: string;
};

// dnd-kit の DndContext に渡す一式。並べ替えの確定時は
// 「動いた 1 枚がどの日の何番目になったか」を PATCH し、他のカードは画面の並びから楽観的に更新する(B6)。
export function useItemSorting({ sequence, fallbackDayId }: Options) {
  const { itinerary, ui } = useAppContext();
  const { items, moveItem } = itinerary;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback(() => {
    ui.setExpandedId(null);
    ui.setConfirmId(null);
  }, [ui]);

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const from = sequence.indexOf(active.id);
      const to = sequence.indexOf(over.id);
      if (from < 0 || to < 0) return;

      const next = arrayMove(sequence, from, to);
      // 先頭の見出しより上に落としたら、最初の日の先頭として扱う
      if (next.length > 1 && isHeaderSortableId(next[1]) && !isHeaderSortableId(next[0])) {
        [next[0], next[1]] = [next[1], next[0]];
      }

      let dayId = fallbackDayId;
      let n = 0;
      const placements = new Map<string, { dayId: string; position: number }>();
      for (const id of next) {
        if (isHeaderSortableId(id)) {
          dayId = dayIdOfHeader(id);
          n = 0;
        } else {
          placements.set(String(id), { dayId, position: n++ });
        }
      }
      const moved = placements.get(String(active.id));
      if (!moved) return;

      const optimistic = items.map((x) => {
        const p = placements.get(x.id);
        return p ? { ...x, ...p } : x;
      });
      void moveItem(String(active.id), moved.dayId, moved.position, optimistic);
    },
    [sequence, fallbackDayId, items, moveItem],
  );

  const modifiers = useMemo(() => [restrictToVerticalAxis], []);

  // 画面の上下 12%(430px 幅の端末で 100px 前後)に入ったら自動スクロール。プロトタイプの edge=100px に合わせる
  const autoScroll = useMemo(() => ({ threshold: { x: 0, y: 0.12 } }), []);

  return { sensors, collisionDetection: closestCenter, modifiers, autoScroll, onDragStart, onDragEnd };
}
