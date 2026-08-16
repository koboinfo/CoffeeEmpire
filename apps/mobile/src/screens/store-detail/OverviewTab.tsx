import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Employee, Store, StoreReport } from '@coffee-empire/core';
import { Card } from '../../components/Card';
import { colors, spacing, typography } from '../../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

function RatingStars({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 5);
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons key={i} name={i < filled ? 'star' : 'star-outline'} size={16} color={colors.gold} />
      ))}
    </View>
  );
}

interface OverviewTabProps {
  store: Store;
  storeReport?: StoreReport;
  storeEmployees: Employee[];
}

export function OverviewTab({ store, storeReport, storeEmployees }: OverviewTabProps) {
  const avgMorale = storeEmployees.length
    ? storeEmployees.reduce((sum, employee) => sum + employee.motivation, 0) / storeEmployees.length
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>今日の売上</Text>
          <Text style={styles.statValue}>{storeReport ? formatCurrency(storeReport.revenue) : '-'}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>客数</Text>
          <Text style={styles.statValue}>{storeReport ? `${storeReport.customers.toLocaleString('ja-JP')}人` : '-'}</Text>
        </Card>
      </View>
      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>レイティング</Text>
          <RatingStars score={store.cumulativeCustomerSatisfaction} />
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>従業員満足度</Text>
          <Text style={styles.statValue}>{avgMorale === null ? '-' : `${Math.round(avgMorale)}`}</Text>
        </Card>
      </View>
      {!storeReport ? (
        <Text style={styles.hint}>「ターンを進める」と今日の売上・客数が表示されます</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, gap: 4 },
  statLabel: { ...typography.label, color: colors.textSecondary },
  statValue: { ...typography.title, color: colors.textPrimary },
  starsRow: { flexDirection: 'row', gap: 2 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
