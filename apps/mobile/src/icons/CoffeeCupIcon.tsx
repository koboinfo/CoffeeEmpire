import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

export function CoffeeCupIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 9h12v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 3.5c-.6.7-.6 1.3 0 2s.6 1.3 0 2M12.5 3.5c-.6.7-.6 1.3 0 2s.6 1.3 0 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
