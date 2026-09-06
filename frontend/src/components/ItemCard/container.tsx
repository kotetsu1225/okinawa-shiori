import { useSortable } from '@dnd-kit/sortable';
import { useAppContext } from '../../app/AppContext';
import { hostOf } from '../../lib/url';
import { sortableRowStyle, sortableTransition } from '../../lib/sortable';
import type { Item } from '../../types/domain';
import { ItemCard } from './presenter';

type Props = {
  item: Item;
  idx: number; // 登場アニメーションの遅延用
};

// 予定カードの container。
// アプリの状態(展開・削除確認・シート)と dnd-kit の useSortable を、見た目だけの ItemCard の Props に落とす。
// 親の SortableContext に item.id が含まれている必要がある。
export function SortableItemCard({ item: it, idx }: Props) {
  const { itinerary, sheet, ui } = useAppContext();
  const { updateItem, removeItem } = itinerary;
  const { expandedId, confirmId, setExpandedId, setConfirmId } = ui;

  const { setNodeRef, attributes, listeners, transform, transition, isDragging, isSorting } = useSortable({
    id: it.id,
    transition: sortableTransition,
  });

  return (
    <ItemCard
      id={it.id}
      title={it.title}
      description={it.description}
      url={it.url}
      urlText={hostOf(it.url)}
      timeText={it.startTime || '時間未定'}
      done={it.done}
      expanded={expandedId === it.id}
      confirming={confirmId === it.id}
      wrapStyle={sortableRowStyle({ transform, transition, isDragging, isSorting, idx })}
      wrapRef={setNodeRef}
      handleProps={{ ...attributes, ...listeners }}
      onToggle={(e) => {
        e.stopPropagation();
        void updateItem(it.id, { done: !it.done });
      }}
      onExpand={() => {
        setExpandedId(expandedId === it.id ? null : it.id);
        setConfirmId(null);
      }}
      onEdit={() => sheet.openEdit(it)}
      onAskRemove={() => setConfirmId(it.id)}
      onCancelRemove={() => setConfirmId(null)}
      onRemove={() => {
        void removeItem(it.id).then(() => {
          setConfirmId(null);
          setExpandedId(null);
        });
      }}
    />
  );
}
