import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../state/gameStore';
import { GameSpeedControl } from './GameSpeedControl';
import { colors, radius, spacing, typography } from '../theme/theme';

const BASE_YEAR = 2026;

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}¥${Math.abs(rounded).toLocaleString('ja-JP')}`;
}

function formatTurnDate(turn: number): string {
  const monthIndex = Math.max(turn - 1, 0);
  const year = BASE_YEAR + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return `${year}年${month}月`;
}

function HudPill({
  icon,
  iconColor,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color={iconColor} />
      <View>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={[styles.pillValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      </View>
    </View>
  );
}

export function HudBar() {
  const insets = useSafeAreaInsets();
  const state = useGameStore((store) => store.state);
  const latestBalanceSheet = useGameStore((store) => store.latestBalanceSheet);

  const netWorth = latestBalanceSheet
    ? latestBalanceSheet.totalAssets - latestBalanceSheet.totalLiabilities
    : state.cash;

  const stockLabel = state.stock.isPublic ? formatCurrency(state.stock.sharePrice) : 'IPO前';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={15} color={colors.roastLight} />
          <Text style={styles.dateText}>{formatTurnDate(state.turn)}</Text>
        </View>
        <GameSpeedControl />
      </View>
      <View style={styles.statsRow}>
        <HudPill icon="cafe" iconColor={colors.gold} label="Cash" value={formatCurrency(state.cash)} />
        <HudPill
          icon="wallet-outline"
          iconColor={colors.roastLight}
          label="Net Worth"
          value={formatCurrency(netWorth)}
        />
        <HudPill
          icon="trending-up"
          iconColor={state.stock.isPublic ? colors.positive : colors.textMuted}
          label="Stock"
          value={stockLabel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.header,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateText: { ...typography.label, color: colors.cream },
  statsRow: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.hudPill,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.hudPillBorder,
  },
  pillLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  pillValue: { fontSize: 13, fontWeight: '700', color: colors.white },
});
