import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { IncomeStatement } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import { LineChart } from '../components/LineChart';
import { AppButton } from '../components/AppButton';
import { ChartIcon, TrendingIcon } from '../icons';
import { colors } from '../theme/theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const BASE_YEAR = 2026;

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}¥${Math.abs(rounded).toLocaleString('ja-JP')}`;
}

function yearOfTurn(turn: number): number {
  return BASE_YEAR + Math.floor(Math.max(turn - 1, 0) / 12);
}

function aggregateByYear(statements: IncomeStatement[]): { key: string; label: string; statement: IncomeStatement }[] {
  const byYear = new Map<number, IncomeStatement[]>();
  for (const statement of statements) {
    const year = yearOfTurn(statement.turn);
    const bucket = byYear.get(year) ?? [];
    bucket.push(statement);
    byYear.set(year, bucket);
  }
  return Array.from(byYear.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, group]) => {
      const sum = (pick: (s: IncomeStatement) => number) => group.reduce((total, s) => total + pick(s), 0);
      return {
        key: `${year}`,
        label: `${year}年`,
        statement: {
          turn: group[group.length - 1].turn,
          revenue: sum((s) => s.revenue),
          costOfGoodsSold: sum((s) => s.costOfGoodsSold),
          grossProfit: sum((s) => s.grossProfit),
          operatingExpenses: sum((s) => s.operatingExpenses),
          depreciation: sum((s) => s.depreciation),
          operatingIncome: sum((s) => s.operatingIncome),
          interestExpense: sum((s) => s.interestExpense),
          pretaxIncome: sum((s) => s.pretaxIncome),
          corporateTax: sum((s) => s.corporateTax),
          netIncome: sum((s) => s.netIncome),
        },
      };
    });
}

function PLRow({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  const negative = value < 0;
  return (
    <View
      className={`flex-row items-center justify-between rounded-sm px-sm py-xs ${emphasis ? 'mt-[2px]' : ''}`}
      style={negative ? { backgroundColor: 'rgba(226,86,75,0.14)' } : undefined}
    >
      <Text className={`text-xs ${emphasis ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>{label}</Text>
      <Text
        className={`text-xs ${emphasis ? 'text-sm font-extrabold' : 'font-semibold'}`}
        style={{ color: negative ? colors.negative : emphasis ? colors.textPrimary : colors.textPrimary }}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

export function FinancialsScreen() {
  const navigation = useNavigation<Navigation>();
  const { state } = useGameStore();
  const statements = state.history.incomeStatements;
  const latestBalanceSheet = state.history.balanceSheets[state.history.balanceSheets.length - 1];
  const [periodMode, setPeriodMode] = useState<'monthly' | 'yearly'>('monthly');

  const revenueSeries = useMemo(() => statements.map((s) => s.revenue), [statements]);
  const netIncomeSeries = useMemo(() => statements.map((s) => s.netIncome), [statements]);

  const monthlyRows = useMemo(
    () =>
      statements
        .slice(-6)
        .reverse()
        .map((statement) => ({ key: `${statement.turn}`, label: `T${statement.turn}`, statement })),
    [statements]
  );
  const yearlyRows = useMemo(() => aggregateByYear(statements), [statements]);
  const rows = periodMode === 'monthly' ? monthlyRows : yearlyRows;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-md p-md pb-xl">
      <Text className="text-xl font-bold text-text-primary">財務諸表</Text>

      <AppButton
        label="詳細コスト内訳を見る(家賃・人件費・原価など)"
        icon="pie-chart"
        variant="secondary"
        onPress={() => navigation.navigate('FinancialBreakdown')}
      />

      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <View className="flex-row items-center gap-xs">
          <TrendingIcon size={14} color={colors.roastLight} />
          <Text className="text-xs font-medium text-text-secondary">売上高の推移</Text>
        </View>
        {statements.length < 2 ? (
          <Text className="text-xs text-text-muted">ターンを2回以上進めるとグラフが表示されます</Text>
        ) : (
          <LineChart values={revenueSeries} color={colors.roast} />
        )}
      </View>

      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <View className="flex-row items-center gap-xs">
          <TrendingIcon size={14} color={colors.positive} />
          <Text className="text-xs font-medium text-text-secondary">純利益の推移</Text>
        </View>
        {statements.length < 2 ? (
          <Text className="text-xs text-text-muted">ターンを2回以上進めるとグラフが表示されます</Text>
        ) : (
          <LineChart values={netIncomeSeries} color={colors.positive} />
        )}
      </View>

      {latestBalanceSheet ? (
        <View className="gap-[2px] rounded-md border border-border bg-surface p-md">
          <Text className="mb-xs text-xs font-medium text-text-secondary">貸借対照表(T{latestBalanceSheet.turn})</Text>
          <PLRow label="資金" value={latestBalanceSheet.cash} />
          <PLRow label="在庫評価額" value={latestBalanceSheet.inventoryValue} />
          <PLRow label="設備・不動産簿価" value={latestBalanceSheet.propertyAndEquipmentNet} />
          <PLRow label="資産合計" value={latestBalanceSheet.totalAssets} emphasis />
          <PLRow label="負債合計" value={latestBalanceSheet.totalLiabilities} />
          <PLRow label="資本合計" value={latestBalanceSheet.totalEquity} emphasis />
        </View>
      ) : null}

      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-xs">
            <ChartIcon size={14} color={colors.roastLight} />
            <Text className="text-xs font-medium text-text-secondary">損益計算書</Text>
          </View>
          <View className="flex-row overflow-hidden rounded-full border border-border">
            <Pressable
              className={`px-sm py-[4px] ${periodMode === 'monthly' ? 'bg-roast' : 'bg-surface-alt'}`}
              onPress={() => setPeriodMode('monthly')}
            >
              <Text className={`text-[11px] font-bold ${periodMode === 'monthly' ? 'text-white' : 'text-text-secondary'}`}>月次</Text>
            </Pressable>
            <Pressable
              className={`px-sm py-[4px] ${periodMode === 'yearly' ? 'bg-roast' : 'bg-surface-alt'}`}
              onPress={() => setPeriodMode('yearly')}
            >
              <Text className={`text-[11px] font-bold ${periodMode === 'yearly' ? 'text-white' : 'text-text-secondary'}`}>年次</Text>
            </Pressable>
          </View>
        </View>

        {rows.length === 0 ? (
          <Text className="text-xs text-text-muted">まだデータがありません</Text>
        ) : (
          rows.map(({ key, label, statement }, index) => (
            <View key={key} className={`gap-[2px] py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
              <Text className="mb-[2px] text-xs font-bold text-text-secondary">{label}</Text>
              <PLRow label="売上高" value={statement.revenue} />
              <PLRow label="売上原価" value={-statement.costOfGoodsSold} />
              <PLRow label="売上総利益" value={statement.grossProfit} emphasis />
              <PLRow label="販管費" value={-statement.operatingExpenses} />
              <PLRow label="営業利益" value={statement.operatingIncome} emphasis />
              <PLRow label="支払利息" value={-statement.interestExpense} />
              <PLRow label="法人税" value={-statement.corporateTax} />
              <PLRow label="当期純利益" value={statement.netIncome} emphasis />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
