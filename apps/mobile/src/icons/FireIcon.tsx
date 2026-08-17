import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function FireIcon({ size = 20, color = colors.negative, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.2c1.2 2.3-1.6 3.6-1.6 6 0 1 .6 1.7 1.6 1.7s1.6-.9 1.4-1.9c1.6 1 2.6 2.8 2.6 4.7A4 4 0 0 1 8 13.7c0-2.3 1.3-3.6 2.2-5 .6-1 1.2-2.2.8-3.5-.4-1.2 0-1.8 1-2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M8.2 14.5A5.8 5.8 0 0 0 14 20.8a5.8 5.8 0 0 0 5.8-5.8c0-1.4-.4-2.4-1-3.3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
