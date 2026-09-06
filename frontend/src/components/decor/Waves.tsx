import type { CSSProperties } from 'react';

const PATH = 'M0 30 C150 60 150 0 300 30 C450 60 450 0 600 30 C750 60 750 0 900 30 C1050 60 1050 0 1200 30 V60 H0 Z';

type Wave = {
  bottom: number;
  height: number;
  duration: number;
  reverse?: boolean;
  opacity?: number;
  fill: string;
};

type Props = {
  height: number; // 波を収める領域の高さ
  waves: [Wave, Wave];
};

// 画面下部で左右に流れる 2 層の波
export function Waves({ height, waves }: Props) {
  const wrap: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height,
    overflow: 'hidden',
    pointerEvents: 'none',
  };
  return (
    <div style={wrap}>
      {waves.map((w, i) => (
        <svg
          key={i}
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: w.bottom,
            left: 0,
            width: '200%',
            height: w.height,
            animation: `waveMove ${w.duration}s linear infinite${w.reverse ? ' reverse' : ''}`,
            opacity: w.opacity,
          }}
        >
          <path d={PATH} fill={w.fill} />
        </svg>
      ))}
    </div>
  );
}
