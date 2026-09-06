import { useSortable } from '@dnd-kit/sortable';
import { fmtDate } from '../../lib/date';
import { headerSortableId, sortableRowStyle, sortableTransition } from '../../lib/sortable';
import { dayColorOf } from '../../lib/theme';
import type { Day } from '../../types/domain';
import { DayHeader } from './presenter';

type Props = {
  day: Day;
  index: number; // 0 始まり。DAY 番号と色に使う
  idx: number; // 登場アニメーションの遅延用
  onOpen: () => void;
};

// 一覧ページの DAY 見出し。掴むことはできないが、カードの落とし先にはなる
// (見出しをまたいで落とすと、その日に移る)。カードと同じ SortableContext に "header:<dayId>" で入る。
export function SortableDayHeader({ day, index, idx, onOpen }: Props) {
  const { setNodeRef, transform, transition, isSorting } = useSortable({
    id: headerSortableId(day.id),
    disabled: { draggable: true, droppable: false },
    transition: sortableTransition,
  });

  return (
    <DayHeader
      id={day.id}
      n={index + 1}
      dateText={fmtDate(day.date)}
      title={day.title}
      color={dayColorOf(index)}
      rowStyle={sortableRowStyle({ transform, transition, isDragging: false, isSorting, idx })}
      rowRef={setNodeRef}
      onOpen={onOpen}
    />
  );
}
