import type { CSSProperties } from 'react';
import { badgeStyle, color, font } from '../../lib/theme';

export type DayHeaderProps = {
  id: string;
  n: number;
  dateText: string;
  title: string;
  color: string;
  rowStyle: CSSProperties;
  rowRef?: (el: HTMLElement | null) => void;
  onOpen: () => void;
};

// 一覧ページの「DAY n  10/10 (土)  那覇・国際通り ›」行
export function DayHeader(p: DayHeaderProps) {
  return (
    <div data-row="header" data-day={p.id} style={{ margin: '22px 0 10px' }}>
      <div ref={p.rowRef} style={p.rowStyle}>
        <button
          onClick={p.onOpen}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '6px 4px', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
        >
          <span style={badgeStyle(p.color)}>{p.n}</span>
          <span style={{ fontFamily: font.grotesque, fontWeight: 700, fontSize: 16, color: color.ink }}>{p.dateText}</span>
          <span style={{ color: color.sub, fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
          <span style={{ color: color.faint, fontSize: 18 }}>›</span>
        </button>
      </div>
    </div>
  );
}
