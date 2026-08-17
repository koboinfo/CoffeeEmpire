import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function CheckCircleIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8.3 12.3l2.5 2.5 5-5.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
