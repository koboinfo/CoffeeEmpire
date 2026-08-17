import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function GaugeIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 16a8 8 0 1 1 16 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path d="M12 16 15.2 10.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 16v.01" stroke={color} strokeWidth={strokeWidth + 0.6} strokeLinecap="round" />
    </Svg>
  );
}
