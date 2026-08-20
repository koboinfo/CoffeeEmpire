import React from 'react';
import { ImageBackground, StyleSheet, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../theme/theme';

const GRID_LINES = Array.from({ length: 9 }, (_, i) => (i + 1) * 10);

interface GridBackdropProps {
  /** 実写があれば優先表示(未配置の間はコード生成のグラデーション+グリッドにフォールバック)。 */
  image?: ImageSourcePropType;
  glowColor?: string;
  className?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * 「深夜のメトロポリタン俯瞰図」風のダークキャンバス背景。
 * ダークネイビーのグラデーション + 淡いパースグリッド + roastカラーのglowブロブで構成する。
 * 実写素材(/src/assets/images/registry.ts)が用意され次第、`image` props経由でそちらに差し替え可能。
 */
export function GridBackdrop({ image, glowColor = colors.roast, className, style, children }: GridBackdropProps) {
  return (
    <View className={className} style={[styles.root, style]}>
      {image ? (
        <ImageBackground source={image} resizeMode="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <LinearGradient
            colors={[colors.background, '#FFFFFF', '#F5FBFF']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
            {GRID_LINES.map((pos) => (
              <Line key={`v${pos}`} x1={pos} y1={0} x2={pos} y2={100} stroke={colors.border} strokeWidth={0.15} opacity={0.45} />
            ))}
            {GRID_LINES.map((pos) => (
              <Line key={`h${pos}`} x1={0} y1={pos} x2={100} y2={pos} stroke={colors.border} strokeWidth={0.15} opacity={0.45} />
            ))}
          </Svg>
          <View pointerEvents="none" style={[styles.glow, styles.glowTopRight, { backgroundColor: glowColor }]} />
          <View pointerEvents="none" style={[styles.glow, styles.glowBottomLeft, { backgroundColor: colors.sky }]} />
        </>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: colors.background },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, opacity: 0.14 },
  glowTopRight: { top: -80, right: -60 },
  glowBottomLeft: { bottom: -90, left: -70, opacity: 0.1 },
});
