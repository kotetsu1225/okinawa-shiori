import { SortableItemCard } from '../../components/ItemCard';
import { badgeStyle, color, font, pillStyle } from '../../lib/theme';
import type { Item } from '../../types/domain';

export type DayPill = { n: number; active: boolean; onSelect: () => void };

export type DayPageProps = {
  pills: DayPill[];
  n: number;
  color: string;
  dateText: string;
  title: string;
  countText: string;
  items: Item[];
  onAdd: () => void;
};

// 日程ページ。カードは並べ替え対応の container(SortableItemCard)を置く。
// DndContext / SortableContext は DayContainer 側が張る。
export function DayPage(p: DayPageProps) {
  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: color.stickyPaper, backdropFilter: 'blur(10px)', padding: '14px 0 10px' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
          {p.pills.map((d) => (
            <button key={d.n} onClick={d.onSelect} style={pillStyle(d.active)}>
              DAY {d.n}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 22px 6px', animation: 'rise .4s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={badgeStyle(p.color)}>{p.n}</span>
          <span style={{ fontFamily: font.grotesque, fontWeight: 700, fontSize: 15, color: color.ink }}>{p.dateText}</span>
        </div>
        <h2 style={{ fontFamily: font.maru, fontWeight: 700, fontSize: 28, lineHeight: 1.25, margin: '6px 0 4px' }}>{p.title}</h2>
        <div style={{ color: color.muted, fontSize: 13 }}>{p.countText}</div>
      </div>
      <div style={{ padding: '10px 16px 0' }}>
        {p.items.map((it, i) => (
          <SortableItemCard key={it.id} item={it} idx={i} />
        ))}
        {p.items.length === 0 && (
          <button
            onClick={p.onAdd}
            style={{ width: '100%', border: `1.5px dashed ${color.lineDash}`, borderRadius: 20, background: 'transparent', padding: 26, color: color.muted, fontSize: 14, cursor: 'pointer' }}
          >
            まだ予定がありません。追加する
          </button>
        )}
      </div>
    </div>
  );
}
