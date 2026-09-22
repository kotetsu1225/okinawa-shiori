import type { ChangeEvent } from 'react';
import { SheetShell } from '../../components/SheetShell';
import { color, pillStyle, saveButtonStyle, sheetInputStyle } from '../../lib/theme';

export type ItemSheetDayPill = { n: number; active: boolean; onPick: () => void };

export type ItemSheetProps = {
  title: string; // 見出し(予定を追加 / 予定を編集)
  saveLabel: string; // 追加する / 保存する
  canSave: boolean;
  days: ItemSheetDayPill[];
  startTime: string;
  itemTitle: string;
  description: string;
  url: string;
  onStartTime: (e: ChangeEvent<HTMLInputElement>) => void;
  onTitle: (e: ChangeEvent<HTMLInputElement>) => void;
  onDescription: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onUrl: (e: ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onClose: () => void;
};

export function ItemSheet(p: ItemSheetProps) {
  return (
    <SheetShell title={p.title} onClose={p.onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {p.days.map((d) => (
            <button key={d.n} onClick={d.onPick} style={pillStyle(d.active)}>
              DAY {d.n}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
          <input
            type="time"
            value={p.startTime}
            onChange={p.onStartTime}
            style={{ ...sheetInputStyle, padding: '0 14px', WebkitAppearance: 'none', appearance: 'none' }}
          />
          <input value={p.itemTitle} onChange={p.onTitle} placeholder="タイトル" style={{ ...sheetInputStyle, minWidth: 0 }} />
        </div>
        <textarea
          value={p.description}
          onChange={p.onDescription}
          placeholder="メモ・説明"
          rows={3}
          style={{ borderRadius: 14, border: `1.5px solid ${color.lineInput}`, background: color.surface, padding: '12px 16px', outline: 'none', fontSize: 15, resize: 'none' }}
        />
        <input value={p.url} onChange={p.onUrl} placeholder="リンク (https://...)" inputMode="url" style={sheetInputStyle} />
        <button onClick={p.onSave} style={saveButtonStyle(p.canSave)}>
          {p.saveLabel}
        </button>
      </div>
    </SheetShell>
  );
}
