import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function BuildingIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 21V5.5L12 3l7 2.5V21" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M3 21h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Rect x="9" y="8" width="2.4" height="2.4" rx="0.4" stroke={color} strokeWidth={strokeWidth * 0.85} />
      <Rect x="12.6" y="8" width="2.4" height="2.4" rx="0.4" stroke={color} strokeWidth={strokeWidth * 0.85} />
      <Rect x="9" y="12.5" width="2.4" height="2.4" rx="0.4" stroke={color} strokeWidth={strokeWidth * 0.85} />
      <Rect x="12.6" y="12.5" width="2.4" height="2.4" rx="0.4" stroke={color} strokeWidth={strokeWidth * 0.85} />
      <Path d="M10.6 21v-3.5h2.8V21" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}
