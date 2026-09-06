import type { ChangeEvent, CSSProperties } from 'react';
import { SheetShell } from '../../components/SheetShell';
import { color, font, saveButtonStyle, sheetInputStyle } from '../../lib/theme';

export type TripSheetDayRow = {
  key: string;
  n: number;
  date: string;
  title: string;
  removable: boolean;
  onDate: (e: ChangeEvent<HTMLInputElement>) => void;
  onTitle: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
};

// 予定が残っている日を消そうとしたときの確認(B9)
export type TripSheetPendingDelete = {
  n: number;
  dateText: string;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export type TripSheetProps = {
  title: string;
  canSave: boolean;
  busy: boolean;
  error: string;
  days: TripSheetDayRow[];
  pendingDelete: TripSheetPendingDelete | null;
  onTitle: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddDay: () => void;
  onSave: () => void;
  onClose: () => void;
};

const labelStyle: CSSProperties = { fontSize: 12, color: color.muted, fontWeight: 700, margin: '4px 0 -6px' };

const rowInputStyle: CSSProperties = {
  height: 46,
  borderRadius: 14,
  border: `1.5px solid ${color.lineInput}`,
  background: '#fff',
  padding: '0 14px',
  outline: 'none',
  fontSize: 15,
  minWidth: 0,
};

const smallButton: CSSProperties = { height: 34, padding: '0 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer' };

export function TripSheet(p: TripSheetProps) {
  return (
    <SheetShell title="旅の設定" onClose={p.onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input value={p.title} onChange={p.onTitle} placeholder="旅のタイトル" style={sheetInputStyle} />
        <label style={labelStyle}>日ごとの日付とテーマ</label>
        {p.days.map((f) => (
          <div key={f.key} style={{ display: 'grid', gridTemplateColumns: 'auto 128px 1fr auto', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: font.grotesque, fontWeight: 700, fontSize: 12, color: color.sea, width: 44 }}>DAY {f.n}</span>
            <input
              type="date"
              value={f.date}
              onChange={f.onDate}
              style={{ ...rowInputStyle, padding: '0 10px', color: color.ink, WebkitAppearance: 'none', appearance: 'none' }}
            />
            <input value={f.title} onChange={f.onTitle} placeholder="例: 那覇" style={rowInputStyle} />
            <button
              onClick={f.onRemove}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 0,
                background: 'transparent',
                color: color.faint,
                fontSize: 18,
                cursor: 'pointer',
                visibility: f.removable ? 'visible' : 'hidden',
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={p.onAddDay}
          style={{ height: 44, borderRadius: 14, border: `1.5px dashed ${color.lineDash}`, background: 'transparent', color: color.muted, fontSize: 14, cursor: 'pointer' }}
        >
          日を追加
        </button>

        {p.pendingDelete && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '10px 14px', borderRadius: 14, background: '#FDEEEA' }}>
            <span style={{ fontSize: 13, color: color.red, flex: '1 1 100%' }}>
              DAY {p.pendingDelete.n}({p.pendingDelete.dateText})に予定が {p.pendingDelete.count} 件あります。まとめて消す？
            </span>
            <button onClick={p.pendingDelete.onConfirm} style={{ ...smallButton, border: 0, background: color.red, color: '#fff', fontWeight: 700 }}>
              はい
            </button>
            <button onClick={p.pendingDelete.onCancel} style={{ ...smallButton, padding: '0 12px', border: 0, background: 'transparent', color: color.sub }}>
              やめる
            </button>
          </div>
        )}

        {p.error && <div style={{ fontSize: 13, color: color.red, fontWeight: 500 }}>{p.error}</div>}

        <button onClick={p.onSave} disabled={p.busy} style={saveButtonStyle(p.canSave && !p.busy)}>
          {p.busy ? '保存中…' : '保存する'}
        </button>
      </div>
    </SheetShell>
  );
}
