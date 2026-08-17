import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function StaffIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.4" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5 20c0-3.6 3.13-6.2 7-6.2s7 2.6 7 6.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
