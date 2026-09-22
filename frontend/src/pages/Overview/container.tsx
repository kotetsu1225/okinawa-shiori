import { useMemo } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppContext } from '../../app/AppContext';
import { itemsOfDay } from '../../hooks/useItinerary';
import { useItemSorting } from '../../hooks/useItemSorting';
import { fmtDate } from '../../lib/date';
import { headlineText } from '../../lib/headline';
import { headerSortableId } from '../../lib/sortable';
import { OverviewPage, type OverviewDayRow } from './presenter';

export function OverviewContainer() {
  const { itinerary, sheet, nav, headline, count } = useAppContext();
  const { trip, days, items } = itinerary;

  // 登場アニメーションの遅延用の連番。プロトタイプと同じく、カード → その日の見出しの順に振る
  const rows: OverviewDayRow[] = useMemo(() => {
    let rowIdx = 0;
    return days.map((d, i) => {
      const cards = itemsOfDay(items, d.id).map((item) => ({ item, idx: rowIdx++ }));
      return {
        day: d,
        index: i,
        headerIdx: rowIdx++,
        items: cards,
        onOpen: () => nav.openDay(i),
        onAdd: () => sheet.openAdd(d.id),
      };
    });
  }, [days, items, nav, sheet]);

  // 画面の並び: 見出し → その日のカード → 次の見出し → …
  const sequence = useMemo(() => rows.flatMap((r) => [headerSortableId(r.day.id), ...r.items.map((c) => c.item.id)]), [rows]);
  const sorting = useItemSorting({ sequence, fallbackDayId: days[0]?.id ?? '' });

  if (!trip || days.length === 0) return null;

  const first = days[0].date;
  const last = days[days.length - 1].date;
  const { text: countText, label: countLabel } = headlineText(headline, count);

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
        <OverviewPage
          dateRange={`${fmtDate(first)} — ${fmtDate(last)} · ${days.length} DAYS`}
          tripTitle={trip.title}
          countText={countText}
          countLabel={countLabel}
          theme={trip.theme}
          days={rows}
          onOpenTripSheet={() => sheet.openTrip(trip.title, days.map((d) => ({ id: d.id, date: d.date, title: d.title })))}
        />
      </SortableContext>
    </DndContext>
  );
}
