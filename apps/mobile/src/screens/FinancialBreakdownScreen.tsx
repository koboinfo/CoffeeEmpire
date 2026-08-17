import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categorizeExpenses, type ExpenseCategory } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import { Gauge } from '../components/Gauge';
import { AppButton } from '../components/AppButton';
import { WarningIcon } from '../icons';
import { colors } from '../theme/theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}¥${Math.abs(rounded).toLocaleString('ja-JP')}`;
}

const CATEGORY_COLOR: Record<ExpenseCategory['key'], string> = {
  rent: colors.gold,
  labor: colors.roastLight,
  utilities: colors.positive,
  cogs: colors.roast,
  other: colors.negative,
};

/** カテゴリごとに「原因分析→経営判断」の導線ボタンを出し分ける。 */
const CATEGORY_ACTION: Record<ExpenseCategory['key'], { label: string; icon: 'people' | 'storefront' | 'pricetag' } | null> = {
  rent: { label: '不採算店舗を確認する(閉店の検討)', icon: 'storefront' },
  labor: { label: 'スタッフの給与調整・解雇を検討する', icon: 'people' },
  utilities: { label: '営業時間・設備数を見直す', icon: 'storefront' },
  cogs: { label: '仕入れ・メニュー価格を見直す', icon: 'pricetag' },
  other: null,
};

export function FinancialBreakdownScreen() {
  const navigation = useNavigation<Navigation>();
  const plItems = useGameStore((s) => s.latestPLItems);
  const eventCashEffect = useGameStore((s) => s.latestEventCashEffect);
  const turn = useGameStore((s) => s.state.turn);

  const breakdown = useMemo(
    () => categorizeExpenses(plItems, eventCashEffect < 0 ? -eventCashEffect : 0),
    [plItems, eventCashEffect]
  );

  const positiveTotal = breakdown.categories.reduce((sum, category) => sum + Math.max(0, category.amount), 0);
  const topCategory = [...breakdown.categories].sort((a, b) => b.amount - a.amount)[0];
  const topAction = topCategory ? CATEGORY_ACTION[topCategory.key] : null;

  if (plItems.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-lg">
        <Text className="text-sm text-text-muted">まだデータがありません。ターンを進めてください。</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-md p-md pb-xl">
      <Text className="text-xl font-bold text-text-primary">詳細コスト内訳(T{turn})</Text>
      <Text className="text-xs text-text-muted">直近ターンのキャッシュアウトをカテゴリ別に可視化しています</Text>

      <View className="gap-md rounded-md border border-border bg-surface p-md">
        {breakdown.categories.map((category) => (
          <Gauge
            key={category.key}
            label={`${category.label}  ${formatCurrency(category.amount)}`}
            value={positiveTotal > 0 ? (Math.max(0, category.amount) / positiveTotal) * 100 : 0}
            color={CATEGORY_COLOR[category.key]}
          />
        ))}
        <View className="mt-xs flex-row items-center justify-between border-t border-border pt-sm">
          <Text className="text-xs font-bold text-text-secondary">合計</Text>
          <Text className="text-sm font-extrabold text-text-primary">{formatCurrency(breakdown.total)}</Text>
        </View>
      </View>

      {topCategory && topCategory.amount > 0 ? (
        <View className="gap-sm rounded-md border border-border bg-surface p-md">
          <View className="flex-row items-center gap-xs">
            <WarningIcon size={14} color={colors.negative} />
            <Text className="flex-1 text-xs font-semibold text-text-secondary">
              最大のコスト要因は「{topCategory.label}」({formatCurrency(topCategory.amount)})です
            </Text>
          </View>
          {topAction ? (
            <AppButton
              label={topAction.label}
              icon={topAction.icon}
              onPress={() => navigation.navigate('Tabs', { screen: 'StoreList' })}
            />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
