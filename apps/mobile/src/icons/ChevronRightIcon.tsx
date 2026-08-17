import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function ChevronRightIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5.5 15.5 12 9 18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
