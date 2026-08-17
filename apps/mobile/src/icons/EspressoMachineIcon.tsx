import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function EspressoMachineIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="6" width="17" height="10" rx="1.6" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M7 6V4.2a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1V6" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M9.5 16v2.2M14.5 16v2.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8.5 20h7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M16.5 9.5h1.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
