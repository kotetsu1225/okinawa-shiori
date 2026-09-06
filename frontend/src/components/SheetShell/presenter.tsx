import type { ReactNode } from 'react';
import { color, font } from '../../lib/theme';

export type SheetShellProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

// 下から出るシートの枠(背景の暗幕・つまみ・見出し・閉じる)。中身は children。
export function SheetShell(p: SheetShellProps) {
  return (
    <>
      <div onClick={p.onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,60,.35)', zIndex: 30, animation: 'fadeIn .25s both' }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, zIndex: 31 }}>
        <div
          style={{
            maxHeight: '92dvh',
            overflowY: 'auto',
            background: color.paper,
            borderRadius: '28px 28px 0 0',
            padding: '14px 22px calc(24px + env(safe-area-inset-bottom))',
            animation: 'slideUp .35s cubic-bezier(.2,.8,.2,1) both',
          }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: color.lineInput, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: font.maru, fontWeight: 700, fontSize: 20, margin: 0 }}>{p.title}</h3>
            <button onClick={p.onClose} style={{ border: 0, background: 'transparent', color: color.muted, fontSize: 14, cursor: 'pointer', padding: 6 }}>
              閉じる
            </button>
          </div>
          {p.children}
        </div>
      </div>
    </>
  );
}
