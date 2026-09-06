import type { CSSProperties } from 'react';

// プロトタイプで使っていた色とフォント。値は index.dc.html から変えていない。
export const color = {
  ink: '#1B2A33',
  sub: '#5A7280',
  muted: '#7F97A3',
  faint: '#9AB0BC',
  line: '#E1ECF1',
  lineInput: '#D5E5EC',
  lineDash: '#C9DDE6',
  sea: '#1E86B4',
  seaDim: '#8FB9CE',
  seaBg: '#EAF5FA',
  coral: '#F27A5E',
  coralDim: '#F3C9BE',
  green: '#5BB58A',
  sun: '#F5C451',
  sunLight: '#FFE08A',
  red: '#E0573B',
  paper: '#F6FAFC',
} as const;

export const font = {
  body: "'Zen Kaku Gothic New',sans-serif",
  maru: "'Zen Maru Gothic',sans-serif",
  grotesque: "'Bricolage Grotesque',sans-serif",
} as const;

// DAY バッジの色は 4 色を巡回する
export const dayColors = [color.sea, color.coral, color.green, color.sun] as const;
export const dayColorOf = (index: number): string => dayColors[index % dayColors.length];

// 日程ページ上部・シート内の「DAY n」ピル
export const pillStyle = (on: boolean): CSSProperties => ({
  flex: '0 0 auto',
  height: 36,
  padding: '0 16px',
  borderRadius: 999,
  border: on ? 0 : `1.5px solid ${color.lineInput}`,
  background: on ? color.sea : '#fff',
  color: on ? '#fff' : color.sub,
  fontFamily: font.grotesque,
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '.1em',
  cursor: 'pointer',
  transition: 'background .2s',
});

// 下部タブ
export const tabStyle = (on: boolean): CSSProperties => ({
  height: 48,
  border: 0,
  background: 'transparent',
  borderRadius: 999,
  fontFamily: font.maru,
  fontWeight: 700,
  fontSize: 15,
  color: on ? color.sea : color.faint,
  cursor: 'pointer',
  transition: 'color .2s',
});

// DAY n の丸バッジ
export const badgeStyle = (col: string): CSSProperties => ({
  width: 34,
  height: 34,
  borderRadius: '50%',
  background: col,
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontFamily: font.grotesque,
  fontWeight: 700,
  fontSize: 15,
  flex: '0 0 auto',
  boxShadow: `0 3px 0 ${col}55`,
});

// シート内の保存ボタン
export const saveButtonStyle = (canSave: boolean): CSSProperties => ({
  height: 54,
  borderRadius: 16,
  border: 0,
  background: canSave ? color.coral : color.coralDim,
  color: '#fff',
  fontFamily: font.maru,
  fontWeight: 700,
  fontSize: 16,
  cursor: canSave ? 'pointer' : 'default',
  boxShadow: canSave ? '0 10px 24px rgba(242,122,94,.3)' : 'none',
  transition: 'background .2s',
  marginTop: 8,
});

// シート内のテキスト入力
export const sheetInputStyle: CSSProperties = {
  height: 50,
  borderRadius: 14,
  border: `1.5px solid ${color.lineInput}`,
  background: '#fff',
  padding: '0 16px',
  outline: 'none',
  fontSize: 16,
};
