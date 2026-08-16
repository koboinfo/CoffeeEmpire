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
