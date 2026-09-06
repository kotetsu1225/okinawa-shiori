import type { CSSProperties } from 'react';
import type { Transform } from '@dnd-kit/utilities';
import { CSS } from '@dnd-kit/utilities';

// dnd-kit の SortableContext に並べる項目の ID。
// カードは item.id そのまま、DAY 見出しは "header:<dayId>" にして 1 本のリストに混ぜる。
const HEADER_PREFIX = 'header:';
export const headerSortableId = (dayId: string) => `${HEADER_PREFIX}${dayId}`;
export const isHeaderSortableId = (id: string | number) => String(id).startsWith(HEADER_PREFIX);
export const dayIdOfHeader = (id: string | number) => String(id).slice(HEADER_PREFIX.length);

// 行の詰まり方はプロトタイプと同じ .22s のイージング
export const sortableTransition = { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' };

type RowState = {
  transform: Transform | null;
  transition: string | undefined;
  isDragging: boolean;
  isSorting: boolean;
  idx: number; // 登場アニメーションの遅延用
};

// 行のラッパーに与えるスタイル。
// 掴んでいる行は持ち上げ、他の行は dnd-kit が計算した transform で詰め、何もしていなければ登場アニメーション。
export function sortableRowStyle({ transform, transition, isDragging, isSorting, idx }: RowState): CSSProperties {
  const translate = transform ? CSS.Translate.toString({ ...transform, x: 0 }) : undefined;
  if (isDragging) {
    return {
      transform: `${translate ?? ''} scale(1.03)`.trim(),
      position: 'relative',
      zIndex: 10,
      transition: 'none',
      boxShadow: '0 18px 40px rgba(20,60,80,.18)',
      borderRadius: 20,
    };
  }
  if (isSorting) return { transform: translate, transition };
  return { animation: 'rise .45s cubic-bezier(.2,.8,.2,1) backwards', animationDelay: `${Math.min(idx, 10) * 40}ms` };
}
