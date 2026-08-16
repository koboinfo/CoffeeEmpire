import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { LineChart } from '../components/LineChart';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

export function FinancialsScreen() {
  const { state } = useGameStore();
  const statements = state.history.incomeStatements;
  const latestBalanceSheet = state.history.balanceSheets[state.history.balanceSheets.length - 1];

  // 履歴が伸びるたびに毎レンダー配列を作り直さないよう、statements参照が変わったときだけ再計算する。
  const revenueSeries = useMemo(() => statements.map((s) => s.revenue), [statements]);
  const netIncomeSeries = useMemo(() => statements.map((s) => s.netIncome), [statements]);
  const recentStatements = useMemo(() => statements.slice(-6).reverse(), [statements]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>財務諸表</Text>

      <Card>
        <Text style={styles.cardLabel}>売上高の推移</Text>
        {statements.length < 2 ? (
          <Text style={styles.emptyText}>ターンを2回以上進めるとグラフが表示されます</Text>
        ) : (
          <LineChart values={revenueSeries} color={colors.roast} />
        )}
      </Card>

      <Card>
        <Text style={styles.cardLabel}>純利益の推移</Text>
        {statements.length < 2 ? (
          <Text style={styles.emptyText}>ターンを2回以上進めるとグラフが表示されます</Text>
        ) : (
          <LineChart values={netIncomeSeries} color={colors.positive} />
        )}
      </Card>

      {latestBalanceSheet ? (
        <Card>
          <Text style={styles.cardLabel}>貸借対照表(T{latestBalanceSheet.turn})</Text>
          <Text style={styles.statementValue}>資金: {formatCurrency(latestBalanceSheet.cash)}</Text>
          <Text style={styles.statementValue}>在庫評価額: {formatCurrency(latestBalanceSheet.inventoryValue)}</Text>
          <Text style={styles.statementValue}>
            設備・不動産簿価: {formatCurrency(latestBalanceSheet.propertyAndEquipmentNet)}
          </Text>
          <Text style={styles.statementValue}>資産合計: {formatCurrency(latestBalanceSheet.totalAssets)}</Text>
          <Text style={styles.statementValue}>負債合計: {formatCurrency(latestBalanceSheet.totalLiabilities)}</Text>
          <Text style={styles.statementValue}>資本合計: {formatCurrency(latestBalanceSheet.totalEquity)}</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.cardLabel}>損益計算書(直近{Math.min(statements.length, 6)}ターン)</Text>
        {recentStatements.map((statement) => (
          <View key={statement.turn} style={styles.statementRow}>
            <Text style={styles.statementTurn}>T{statement.turn}</Text>
            <Text style={styles.statementValue}>売上 {Math.round(statement.revenue).toLocaleString('ja-JP')}</Text>
            <Text style={styles.statementValue}>純利益 {Math.round(statement.netIncome).toLocaleString('ja-JP')}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.title, color: colors.textPrimary },
  cardLabel: { ...typography.label, color: colors.textSecondary },
  emptyText: { fontSize: 13, color: colors.textMuted },
  statementRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 4 },
  statementTurn: { width: 32, fontWeight: '600', color: colors.textPrimary },
  statementValue: { fontSize: 13, color: colors.textPrimary },
});
