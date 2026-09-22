import { color, tabStyle } from '../../lib/theme';

export type TabBarProps = {
  active: 'overview' | 'day';
  onOverview: () => void;
  onDay: () => void;
  onAdd: () => void;
};

// 画面下部に固定のタブ(一覧 / + / 日程)
export function TabBar(p: TabBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        padding: '0 16px calc(14px + env(safe-area-inset-bottom))',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          background: 'rgba(255,255,255,.92)',
          backdropFilter: 'blur(14px)',
          border: `1px solid ${color.line}`,
          borderRadius: 999,
          padding: 6,
          boxShadow: '0 10px 30px rgba(20,60,80,.12)',
        }}
      >
        <button onClick={p.onOverview} style={tabStyle(p.active === 'overview')}>
          一覧
        </button>
        <button
          onClick={p.onAdd}
          aria-label="予定を追加"
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            border: 0,
            background: color.coral,
            color: '#fff',
            fontSize: 28,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: `0 8px 20px ${color.accentShadow}`,
            display: 'grid',
            placeItems: 'center',
            paddingBottom: 3,
          }}
        >
          +
        </button>
        <button onClick={p.onDay} style={tabStyle(p.active === 'day')}>
          日程
        </button>
      </div>
    </div>
  );
}
