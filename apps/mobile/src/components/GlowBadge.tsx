import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { radius } from '../theme/theme';

interface GlowBadgeProps {
  children: React.ReactNode;
  color: string;
  size?: number;
  style?: ViewStyle;
}

/** 色付きシャドウで「発光しているピン/バッジ」を表現する共通コンポーネント。 */
export function GlowBadge({ children, color, size = 28, style }: GlowBadgeProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
