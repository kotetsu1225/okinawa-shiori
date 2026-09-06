import type { CSSProperties, HTMLAttributes, MouseEvent } from 'react';
import { color, font } from '../../lib/theme';

export type ItemCardProps = {
  id: string;
  title: string;
  description: string;
  url: string;
  urlText: string;
  timeText: string;
  done: boolean;
  expanded: boolean;
  confirming: boolean;
  // 並べ替え用。行のラッパーのスタイル・ref と、ハンドルに付けるリスナー(dnd-kit が渡す)
  wrapStyle: CSSProperties;
  wrapRef?: (el: HTMLElement | null) => void;
  handleProps?: HTMLAttributes<HTMLDivElement>;
  onToggle: (e: MouseEvent) => void;
  onExpand: () => void;
  onEdit: () => void;
  onAskRemove: () => void;
  onCancelRemove: () => void;
  onRemove: () => void;
};

const dotStyle: CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: color.coral, flex: '0 0 auto' };

const smallButton: CSSProperties = {
  height: 34,
  padding: '0 14px',
  borderRadius: 999,
  fontSize: 13,
  cursor: 'pointer',
};

// 予定カード。状態は持たず、Props の通りに描く。
export function ItemCard(p: ItemCardProps) {
  const titleStyle: CSSProperties = {
    fontFamily: font.maru,
    fontWeight: 700,
    fontSize: 17,
    lineHeight: 1.3,
    color: p.done ? color.faint : color.ink,
    textDecoration: p.done ? 'line-through' : 'none',
    transition: 'color .25s',
  };
  const checkStyle: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: p.done ? '0' : `2px dashed ${color.lineDash}`,
    background: p.done ? color.green : '#fff',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    transition: 'background .25s, border .25s',
    animation: p.done ? 'pop .35s' : 'none',
  };
  const expStyle: CSSProperties = {
    display: 'grid',
    gridTemplateRows: p.expanded ? '1fr' : '0fr',
    transition: 'grid-template-rows .35s cubic-bezier(.2,.8,.2,1)',
  };

  return (
    <div data-row="card" data-id={p.id} style={{ marginBottom: 10 }}>
      <div ref={p.wrapRef} style={p.wrapStyle}>
        <div style={{ background: '#fff', borderRadius: 22, border: `1.5px solid ${color.line}`, overflow: 'hidden', boxShadow: `0 2px 0 ${color.line}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) auto', alignItems: 'center', gap: 6, padding: '12px 4px 12px 12px' }}>
            <button onClick={p.onToggle} aria-label="完了" style={checkStyle}>
              ✓
            </button>
            <div onClick={p.onExpand} style={{ minWidth: 0, padding: '4px 6px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={dotStyle} />
                <span style={{ fontFamily: font.grotesque, fontWeight: 700, fontSize: 13, color: color.sub, letterSpacing: '.04em' }}>{p.timeText}</span>
              </div>
              <div style={titleStyle}>{p.title}</div>
            </div>
            <div
              {...p.handleProps}
              aria-label="並べ替え"
              style={{ touchAction: 'none', cursor: 'grab', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 4, userSelect: 'none', outline: 'none' }}
            >
              <div style={{ width: 18, height: 2, borderRadius: 2, background: '#C3D5DE' }} />
              <div style={{ width: 18, height: 2, borderRadius: 2, background: '#C3D5DE' }} />
              <div style={{ width: 18, height: 2, borderRadius: 2, background: '#C3D5DE' }} />
            </div>
          </div>
          <div style={expStyle}>
            <div style={{ minHeight: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0 16px 14px 56px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.description && <p style={{ margin: 0, color: '#4A6270', fontSize: 14, whiteSpace: 'pre-wrap' }}>{p.description}</p>}
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      color: color.sea,
                      textDecoration: 'none',
                      background: color.seaBg,
                      borderRadius: 999,
                      padding: '6px 12px',
                      width: 'fit-content',
                      maxWidth: '100%',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.urlText}</span>
                    <span>↗</span>
                  </a>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  <button
                    onClick={p.onEdit}
                    style={{ ...smallButton, border: `1.5px solid ${color.lineInput}`, background: '#fff', fontWeight: 700, color: color.ink }}
                  >
                    編集
                  </button>
                  {p.confirming ? (
                    <>
                      <span style={{ fontSize: 13, color: color.red, marginLeft: 4 }}>消す？</span>
                      <button onClick={p.onRemove} style={{ ...smallButton, border: 0, background: color.red, color: '#fff', fontWeight: 700 }}>
                        はい
                      </button>
                      <button onClick={p.onCancelRemove} style={{ ...smallButton, padding: '0 12px', border: 0, background: 'transparent', color: color.sub }}>
                        やめる
                      </button>
                    </>
                  ) : (
                    <button onClick={p.onAskRemove} style={{ ...smallButton, border: 0, background: 'transparent', color: color.faint }}>
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
