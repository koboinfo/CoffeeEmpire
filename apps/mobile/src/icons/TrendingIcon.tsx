import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

interface TrendingIconProps extends IconProps {
  direction?: 'up' | 'down';
}

export function TrendingIcon({ size = 20, color = colors.textPrimary, strokeWidth = 1.8, direction = 'up' }: TrendingIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={direction === 'down' ? { transform: [{ scaleY: -1 }] } : undefined}>
      <Path
        d="M3.5 17 9 11.5l4 4 7-7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15.5 8h4.5v4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
