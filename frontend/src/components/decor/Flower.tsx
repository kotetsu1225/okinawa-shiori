import type { CSSProperties } from 'react';
import { color } from '../../lib/theme';

// ハイビスカス風の 5 弁の花。ログインと一覧で寸法が違うので、値はプロトタイプのまま表にしておく。
const variants = {
  large: {
    box: 76,
    petal: 36,
    petals: [
      [20, 0],
      [40, 14],
      [32, 38],
      [8, 38],
      [0, 14],
    ],
    center: { left: 28, top: 24, size: 20 },
  },
  small: {
    box: 44,
    petal: 20,
    petals: [
      [12, 0],
      [24, 8],
      [19, 22],
      [5, 22],
      [0, 8],
    ],
    center: { left: 16, top: 14, size: 12 },
  },
} as const;

type Props = {
  variant: keyof typeof variants;
  top: number;
  left?: number;
  right?: number;
};

export function Flower({ variant, top, left, right }: Props) {
  const v = variants[variant];
  const wrap: CSSProperties = {
    position: 'absolute',
    top,
    left,
    right,
    width: v.box,
    height: v.box,
    animation: 'sunDrift 11s ease-in-out infinite reverse',
  };
  return (
    <div style={wrap}>
      {v.petals.map(([l, t], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: l,
            top: t,
            width: v.petal,
            height: v.petal,
            borderRadius: '50%',
            background: color.coral,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: v.center.left,
          top: v.center.top,
          width: v.center.size,
          height: v.center.size,
          borderRadius: '50%',
          background: color.sunLight,
        }}
      />
    </div>
  );
}
