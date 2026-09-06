import { useMemo } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppContext } from '../../app/AppContext';
import { itemsOfDay } from '../../hooks/useItinerary';
import { useItemSorting } from '../../hooks/useItemSorting';
import { fmtDate } from '../../lib/date';
import { dayColorOf } from '../../lib/theme';
import { DayPage } from './presenter';

export function DayContainer() {
  const { itinerary, sheet, nav } = useAppContext();
  const { trip, days, items } = itinerary;

  const idx = Math.min(nav.dayIdx, Math.max(0, days.length - 1));
  const cur = days[idx];
  const list = useMemo(() => (cur ? itemsOfDay(items, cur.id) : []), [items, cur]);
  const sequence = useMemo(() => list.map((x) => x.id), [list]);
  const sorting = useItemSorting({ sequence, fallbackDayId: cur?.id ?? '' });

  if (!trip || !cur) return null;

  const doneCount = list.filter((x) => x.done).length;

  return (
    <DndContext
      sensors={sorting.sensors}
      collisionDetection={sorting.collisionDetection}
      modifiers={sorting.modifiers}
      autoScroll={sorting.autoScroll}
      onDragStart={sorting.onDragStart}
      onDragEnd={sorting.onDragEnd}
    >
      <SortableContext items={sequence} strategy={verticalListSortingStrategy}>
        <DayPage
          pills={days.map((_, i) => ({ n: i + 1, active: i === idx, onSelect: () => nav.selectDay(i) }))}
          n={idx + 1}
          color={dayColorOf(idx)}
          dateText={fmtDate(cur.date)}
          title={cur.title}
          countText={list.length ? `${list.length}件の予定 · ${doneCount}件完了` : ''}
          items={list}
          onAdd={() => sheet.openAdd(cur.id)}
        />
      </SortableContext>
    </DndContext>
  );
}
