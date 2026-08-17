import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function BanknoteIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="6" width="19" height="12" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="12" cy="12" r="2.6" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="6" cy="12" r="0.55" fill={color} />
      <Circle cx="18" cy="12" r="0.55" fill={color} />
    </Svg>
  );
}
