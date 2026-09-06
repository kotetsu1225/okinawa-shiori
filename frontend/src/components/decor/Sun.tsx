import type { CSSProperties } from 'react';
import { color } from '../../lib/theme';

type Props = {
  size: number;
  top: number;
  right: number;
  shadow: string;
};

// 右上でゆっくり漂う太陽
export function Sun({ size, top, right, shadow }: Props) {
  const style: CSSProperties = {
    position: 'absolute',
    top,
    right,
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle at 40% 40%,${color.sunLight},${color.sun})`,
    boxShadow: shadow,
    animation: 'sunDrift 9s ease-in-out infinite',
  };
  return <div style={style} />;
}
