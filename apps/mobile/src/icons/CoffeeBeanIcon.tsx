import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function CoffeeBeanIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5c4.5 1 7.5 4.6 7.5 8.5s-3 7.5-7.5 8.5C7.5 19.5 4.5 15.9 4.5 12S7.5 4.5 12 3.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M12 4.5c-2.2 2-3.2 4.7-3.2 7.5s1 5.5 3.2 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
