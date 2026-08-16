import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';

export interface LineChartProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

/**
 * 依存を増やさないための最小限の折れ線グラフ。財務推移(純利益・売上・資金)の描画に使う。
 * valuesが1件以下の場合は何も描画しない(まだ描画に足るデータがないため)。
 */
export function LineChart({ values, width = 320, height = 160, color = '#5B3A29' }: LineChartProps) {
  if (values.length < 2) {
    return <View style={{ width, height }} />;
  }

  const padding = 12;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const zeroY = padding + (1 - (0 - min) / range) * (height - padding * 2);

  return (
    <Svg width={width} height={height}>
      {min <= 0 && max >= 0 ? (
        <Line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#999999" strokeWidth={1} strokeDasharray="4,4" />
      ) : null}
      <Polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2} />
      {points.map((p, index) => (
        <Circle key={index} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
    </Svg>
  );
}
