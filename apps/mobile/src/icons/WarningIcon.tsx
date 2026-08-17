import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function WarningIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5 21.5 20h-19L12 3.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="M12 10v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 16.7v.1" stroke={color} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" />
    </Svg>
  );
}
