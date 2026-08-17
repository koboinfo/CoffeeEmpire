import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function CalendarIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="15" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
