import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Card } from '../components/Card';
import { colors, spacing, typography, radius } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const { latestIncomeStatement, error, dismissError, state } = useGameStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>おかえりなさい、経営者さん</Text>

      {error ? (
        <Pressable style={styles.errorBanner} onPress={dismissError}>
          <Ionicons name="alert-circle" size={16} color={colors.errorText} />
          <Text style={styles.errorText}>{error}(タップして閉じる)</Text>
        </Pressable>
      ) : null}

      <View style={styles.statusRow}>
        {Object.values(state.statuses).map((status) => (
          <Card key={status.key} style={styles.statusCard}>
            <Text style={styles.statusLabel}>{status.key}</Text>
            <Text style={styles.statusValue}>{Math.round(status.value)}</Text>
          </Card>
        ))}
      </View>

      {latestIncomeStatement ? (
        <Card>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="trending-up" size={16} color={colors.roastLight} />
            <Text style={styles.cardLabel}>直近の損益</Text>
          </View>
          <Text style={styles.plLine}>売上: {formatCurrency(latestIncomeStatement.revenue)}</Text>
          <Text style={[styles.plLine, latestIncomeStatement.netIncome >= 0 ? styles.positive : styles.negative]}>
            純利益: {formatCurrency(latestIncomeStatement.netIncome)}
          </Text>
        </Card>
      ) : null}

      <View style={styles.linkRow}>
        <Pressable style={styles.linkCard} onPress={() => navigation.navigate('Financials')}>
          <Ionicons name="bar-chart" size={22} color={colors.roast} />
          <Text style={styles.linkLabel}>財務諸表</Text>
        </Pressable>
        <Pressable style={styles.linkCard} onPress={() => navigation.navigate('RealEstate')}>
          <Ionicons name="business" size={22} color={colors.roast} />
          <Text style={styles.linkLabel}>不動産投資</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.title, color: colors.textPrimary },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusCard: { flex: 1, alignItems: 'center' },
  statusLabel: { ...typography.label, color: colors.textSecondary },
  statusValue: { ...typography.title, color: colors.textPrimary },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardLabel: { ...typography.label, color: colors.textSecondary },
  plLine: { ...typography.body, color: colors.textPrimary },
  positive: { color: colors.positive },
  negative: { color: colors.negative },
  linkRow: { flexDirection: 'row', gap: spacing.sm },
  linkCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorText: { color: colors.errorText, fontSize: 13, flexShrink: 1 },
});
