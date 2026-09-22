import { Sun } from '../../components/decor/Sun';
import { Flower } from '../../components/decor/Flower';
import { Waves } from '../../components/decor/Waves';
import { Onsen } from '../../components/decor/Onsen';
import { SortableDayHeader } from '../../components/DayHeader';
import { SortableItemCard } from '../../components/ItemCard';
import { color, font } from '../../lib/theme';
import type { Day, Item, Trip } from '../../types/domain';

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
  theme: Trip['theme'];
  days: OverviewDayRow[];
  onOpenTripSheet: () => void;
};

// 一覧ページ。カードと見出しは並べ替え対応の container(Sortable*)を置く。
// DndContext / SortableContext は OverviewContainer 側が張る。
export function OverviewPage(p: OverviewPageProps) {
  const onsen = p.theme === 'onsen';
  return (
    <div style={{ paddingBottom: 120 }}>
      <div className={onsen ? 'onsen-hero' : undefined} style={{ position: 'relative', padding: onsen ? '78px 24px 38px' : '56px 22px 54px', background: onsen ? 'linear-gradient(150deg, #E8E3D2, #F1EDDF 75%)' : 'linear-gradient(170deg,#CFEAF4 0%,#E4F3F8 100%)', overflow: 'hidden' }}>
        {!onsen && <Waves
          height={44}
          waves={[
            { bottom: 10, height: 34, duration: 16, opacity: 0.45, fill: '#8FCBE0' },
            { bottom: -1, height: 32, duration: 11, reverse: true, fill: color.paper },
          ]}
        />}
        {!onsen && <Sun size={92} top={44} right={26} shadow="0 14px 34px rgba(245,196,81,.35)" />}
        {!onsen && <Flower variant="small" top={118} right={104} />}
        {onsen && <><div className="onsen-eyebrow"><span>♨</span> ONSEN JOURNEY</div><Onsen /></>}

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
        <div style={{ position: 'relative', fontFamily: font.grotesque, fontSize: 12, letterSpacing: onsen ? '.12em' : '.22em', color: color.sea, fontWeight: 700, animation: 'rise .5s both' }}>{p.dateRange}</div>
        <h1 style={{ position: 'relative', fontFamily: font.maru, fontWeight: 700, fontSize: onsen ? 32 : 34, lineHeight: onsen ? 1.45 : 1.2, margin: '8px 0 22px', paddingRight: onsen ? 54 : 0, animation: 'rise .5s .05s backwards' }}>{p.tripTitle}</h1>
        {onsen && <p className="onsen-caption">湯けむりと、ひと休み。</p>}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', flexWrap: onsen ? 'wrap' : undefined, width: onsen ? '62%' : undefined, gap: 10, animation: 'rise .5s .1s backwards' }}>
          <div style={{ fontFamily: font.grotesque, fontWeight: 700, fontSize: 64, lineHeight: 1, color: color.sea, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{p.countText}</div>
          <div style={{ paddingBottom: 8, color: color.sub, fontWeight: 500, fontSize: onsen ? 13 : undefined }}>{p.countLabel}</div>
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
