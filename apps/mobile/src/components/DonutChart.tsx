import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/theme';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({ data, size = 140, strokeWidth = 20 }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  let offsetAccumulated = 0;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0
          ? data.map((slice) => {
              const fraction = slice.value / total;
              const dashLength = fraction * circumference;
              const dashArray = `${dashLength} ${circumference - dashLength}`;
              const strokeDashoffset = -offsetAccumulated;
              offsetAccumulated += dashLength;
              return (
                <Circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={dashArray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  rotation={-90}
                  originX={size / 2}
                  originY={size / 2}
                />
              );
            })
          : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
