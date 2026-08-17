import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/theme';
import type { IconProps } from './types';

interface StarIconProps extends IconProps {
  filled?: boolean;
}

export function StarIcon({ size = 20, color = colors.gold, strokeWidth = 1.8, filled = true }: StarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.8l2.47 5.1 5.53.8-4 3.94.94 5.56L12 16.5l-4.94 2.7.94-5.56-4-3.94 5.53-.8L12 3.8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}
