import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../state/gameStore';
import { colors, radius, spacing, typography } from '../theme/theme';

const SPEED_OPTIONS = [1, 2, 5] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

export function GameSpeedControl() {
  const advance = useGameStore((store) => store.advance);
  const [activeSpeed, setActiveSpeed] = useState<Speed | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const runSpeed = async (speed: Speed) => {
    if (isAdvancing) return;
    setActiveSpeed(speed);
    setIsAdvancing(true);
    try {
      for (let i = 0; i < speed; i += 1) {
        await advance();
        // 決算・イベント・実績解除の通知はプレイヤーが確認するまで、バッチ内の残りターンは
        // 進めない(先に進めてしまうと latestSettlement/latestTriggeredEvents/
        // latestUnlockedAchievements が次ターンの結果で上書きされ、モーダルが一度も表示
        // されないまま消えてしまうため)。isBankruptはadvance()自体が早期returnするので、
        // これ以上ターンを重ねる意味がないためここでも止める
        // (isVictoryAchievedは一度trueになったら永続する値でありadvance()を止める必要が
        // ないため対象外。VictoryScreenはstate.isVictoryAchievedを見て常にオーバーレイ表示される)。
        const { latestSettlement, latestTriggeredEvents, latestTriggeredStoreEvents, latestUnlockedAchievements, state: latestState } =
          useGameStore.getState();
        if (
          latestSettlement ||
          latestTriggeredEvents.length > 0 ||
          latestTriggeredStoreEvents.length > 0 ||
          latestUnlockedAchievements.length > 0 ||
          latestState.isBankrupt
        ) {
          break;
        }
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, activeSpeed === null && !isAdvancing && styles.buttonActive]}
        disabled={isAdvancing}
        onPress={() => setActiveSpeed(null)}
      >
        <Ionicons name="pause" size={14} color={colors.textPrimary} />
      </Pressable>
      {SPEED_OPTIONS.map((speed) => (
        <Pressable
          key={speed}
          style={[styles.button, activeSpeed === speed && styles.buttonActive]}
          disabled={isAdvancing}
          onPress={() => runSpeed(speed)}
        >
          {isAdvancing && activeSpeed === speed ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={[styles.buttonLabel, activeSpeed === speed && styles.buttonLabelActive]}>{speed}x</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs / 2,
    backgroundColor: colors.hudPill,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.hudPillBorder,
  },
  button: {
    minWidth: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  buttonActive: { backgroundColor: colors.roast },
  buttonLabel: { ...typography.label, fontSize: 12, color: colors.textSecondary },
  buttonLabelActive: { color: colors.white, fontWeight: '700' },
});
