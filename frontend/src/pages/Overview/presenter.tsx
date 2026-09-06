import { Sun } from '../../components/decor/Sun';
import { Flower } from '../../components/decor/Flower';
import { Waves } from '../../components/decor/Waves';
import { SortableDayHeader } from '../../components/DayHeader';
import { SortableItemCard } from '../../components/ItemCard';
import { color, font } from '../../lib/theme';
import type { Day, Item } from '../../types/domain';

export type OverviewDayRow = {
  day: Day;
  index: number;
  headerIdx: number; // 登場アニメーションの遅延用
  items: { item: Item; idx: number }[];
  onOpen: () => void;
  onAdd: () => void;
};

export type OverviewPageProps = {
  dateRange: string;
  tripTitle: string;
  countText: string;
  countLabel: string;
  greeting: string;
  days: OverviewDayRow[];
  onOpenTripSheet: () => void;
  onLogout: () => void;
};

// 一覧ページ。カードと見出しは並べ替え対応の container(Sortable*)を置く。
// DndContext / SortableContext は OverviewContainer 側が張る。
export function OverviewPage(p: OverviewPageProps) {
  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ position: 'relative', padding: '56px 22px 54px', background: 'linear-gradient(170deg,#CFEAF4 0%,#E4F3F8 100%)', overflow: 'hidden' }}>
        <Waves
          height={44}
          waves={[
            { bottom: 10, height: 34, duration: 16, opacity: 0.45, fill: '#8FCBE0' },
            { bottom: -1, height: 32, duration: 11, reverse: true, fill: color.paper },
          ]}
        />
        <Sun size={92} top={44} right={26} shadow="0 14px 34px rgba(245,196,81,.35)" />
        <Flower variant="small" top={118} right={104} />

        <button
          onClick={p.onOpenTripSheet}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            height: 34,
            padding: '0 14px',
            borderRadius: 999,
            border: 0,
            background: 'rgba(255,255,255,.75)',
            color: color.sea,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          旅の設定
        </button>
        <button
          onClick={p.onLogout}
          style={{ position: 'absolute', top: 14, left: 16, height: 34, padding: '0 14px', borderRadius: 999, border: 0, background: 'transparent', color: color.muted, fontSize: 12, cursor: 'pointer' }}
        >
          {p.greeting}
        </button>
        <div style={{ fontFamily: font.grotesque, fontSize: 12, letterSpacing: '.22em', color: color.sea, fontWeight: 700, animation: 'rise .5s both' }}>{p.dateRange}</div>
        <h1 style={{ fontFamily: font.maru, fontWeight: 700, fontSize: 34, lineHeight: 1.2, margin: '8px 0 22px', animation: 'rise .5s .05s backwards' }}>{p.tripTitle}</h1>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, animation: 'rise .5s .1s backwards' }}>
          <div style={{ fontFamily: font.grotesque, fontWeight: 700, fontSize: 64, lineHeight: 1, color: color.sea, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{p.countText}</div>
          <div style={{ paddingBottom: 8, color: color.sub, fontWeight: 500 }}>{p.countLabel}</div>
        </div>
      </div>

      <div style={{ padding: '6px 16px 0' }}>
        {p.days.map((d) => (
          <div key={d.day.id}>
            <SortableDayHeader day={d.day} index={d.index} idx={d.headerIdx} onOpen={d.onOpen} />
            {d.items.map(({ item, idx }) => (
              <SortableItemCard key={item.id} item={item} idx={idx} />
            ))}
            {d.items.length === 0 && (
              <button
                onClick={d.onAdd}
                style={{ width: '100%', border: `1.5px dashed ${color.lineDash}`, borderRadius: 20, background: 'transparent', padding: 18, color: color.muted, fontSize: 14, cursor: 'pointer' }}
              >
                この日の予定を追加
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
