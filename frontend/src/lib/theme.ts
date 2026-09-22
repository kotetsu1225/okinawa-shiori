import type { CSSProperties } from 'react';

// CSS variables let every component inherit the selected trip theme.
// The fallbacks preserve the original Okinawa palette.
export const color = {
  ink: 'var(--color-ink, #1B2A33)',
  sub: 'var(--color-sub, #5A7280)',
  muted: 'var(--color-muted, #7F97A3)',
  faint: 'var(--color-faint, #9AB0BC)',
  line: 'var(--color-line, #E1ECF1)',
  lineInput: 'var(--color-lineInput, #D5E5EC)',
  lineDash: 'var(--color-lineDash, #C9DDE6)',
  sea: 'var(--color-sea, #1E86B4)',
  seaDim: 'var(--color-seaDim, #8FB9CE)',
  seaBg: 'var(--color-seaBg, #EAF5FA)',
  coral: 'var(--color-coral, #F27A5E)',
  coralDim: 'var(--color-coralDim, #F3C9BE)',
  green: 'var(--color-green, #5BB58A)',
  sun: 'var(--color-sun, #F5C451)',
  sunLight: 'var(--color-sunLight, #FFE08A)',
  red: 'var(--color-red, #E0573B)',
  paper: 'var(--color-paper, #F6FAFC)',
  surface: 'var(--color-surface, #fff)',
  stickyPaper: 'var(--color-sticky-paper, rgba(246,250,252,.92))',
  accentShadow: 'var(--color-accent-shadow, rgba(242,122,94,.3))',
  handle: 'var(--color-handle, #C3D5DE)',
  description: 'var(--color-description, #4A6270)',
} as const;

export const font = {
  body: "'Zen Kaku Gothic New',sans-serif",
  maru: "var(--font-heading, 'Zen Maru Gothic', sans-serif)",
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
  background: on ? color.sea : color.surface,
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
  boxShadow: `0 3px 0 color-mix(in srgb, ${col} 33%, transparent)`,
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
  boxShadow: canSave ? `0 10px 24px ${color.accentShadow}` : 'none',
  transition: 'background .2s',
  marginTop: 8,
});

// シート内のテキスト入力
export const sheetInputStyle: CSSProperties = {
  height: 50,
  borderRadius: 14,
  border: `1.5px solid ${color.lineInput}`,
  background: color.surface,
  padding: '0 16px',
  outline: 'none',
  fontSize: 16,
};
