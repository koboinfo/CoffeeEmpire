import React from 'react';
import { View, Text } from 'react-native';
import type { Employee, Store, StoreReport } from '@coffee-empire/core';
import { evaluateStoreAlerts } from '@coffee-empire/core';
import { Gauge } from '../../components/Gauge';
import { ChartIcon, StaffIcon, StarIcon, TrendingIcon, WarningIcon } from '../../icons';
import { colors } from '../../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

function StatCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: 'up' | 'down';
}) {
  return (
    <View className="flex-1 gap-xs rounded-md border border-border bg-surface p-md">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-xs">
          {icon}
          <Text className="text-xs font-medium text-text-secondary">{label}</Text>
        </View>
        {trend ? <TrendingIcon size={14} direction={trend} color={trend === 'up' ? colors.positive : colors.negative} /> : null}
      </View>
      <Text className="text-2xl font-extrabold text-text-primary">{value}</Text>
    </View>
  );
}

function RatingStars({ score }: { score: number }) {
  const filled = Math.max(0, Math.min(5, Math.round((score / 100) * 5)));
  return (
    <View className="flex-row gap-[2px]">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={18} filled={i < filled} color={i < filled ? colors.gold : colors.textMuted} />
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
  const satisfaction = Math.max(0, Math.min(100, store.cumulativeCustomerSatisfaction));

  // Management by Exception(レポート§5-2): 閾値を超えた項目だけを警告として表示する。
  // weeksOfInventoryRemaining/cityMarketShareRatioはこの画面に必要なデータが渡ってきていないため未評価。
  const trueUtilization =
    storeReport && storeReport.capacity > 0 ? storeReport.demandCustomers / storeReport.capacity : undefined;
  const storeAlerts = evaluateStoreAlerts({
    storeId: store.id,
    storeName: store.name,
    utilization: trueUtilization,
    morale: avgMorale ?? undefined,
  });

  return (
    <View className="gap-sm">
      <View className="flex-row gap-sm">
        <StatCard
          icon={<TrendingIcon size={14} color={colors.roastLight} />}
          label="今日の売上"
          value={storeReport ? formatCurrency(storeReport.revenue) : '-'}
        />
        <StatCard
          icon={<StaffIcon size={14} color={colors.roastLight} />}
          label="客数"
          value={storeReport ? `${storeReport.customers.toLocaleString('ja-JP')}人` : '-'}
        />
      </View>

      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-xs">
            <ChartIcon size={14} color={colors.roastLight} />
            <Text className="text-xs font-medium text-text-secondary">顧客満足度レイティング</Text>
          </View>
          <TrendingIcon size={14} direction={satisfaction >= 50 ? 'up' : 'down'} color={satisfaction >= 50 ? colors.positive : colors.negative} />
        </View>
        <RatingStars score={satisfaction} />
        <Gauge label="満足度スコア" value={satisfaction} color={satisfaction >= 50 ? colors.positive : colors.negative} />
      </View>

      {storeReport && storeReport.capacity > 0 ? (
        <View className="gap-sm rounded-md border border-border bg-surface p-md">
          <View className="flex-row items-center gap-xs">
            <ChartIcon size={14} color={colors.roastLight} />
            <Text className="text-xs font-medium text-text-secondary">
              座席稼働率({storeReport.customers.toLocaleString('ja-JP')}人 / 上限{storeReport.capacity.toLocaleString('ja-JP')}人)
            </Text>
          </View>
          <Gauge
            label="稼働率"
            value={Math.min(100, (storeReport.customers / storeReport.capacity) * 100)}
            color={storeReport.customers >= storeReport.capacity ? colors.negative : colors.positive}
          />
          {storeAlerts
            .filter((alert) => alert.code === 'high-utilization')
            .map((alert) => (
              <View key={alert.code} className="flex-row items-start gap-xs">
                <WarningIcon size={12} color={colors.negative} />
                <Text className="flex-1 text-xs text-negative">
                  {alert.message}。混雑が続くと顧客満足度・従業員モチベーションが低下します。座席増強を検討してください。
                </Text>
              </View>
            ))}
        </View>
      ) : null}

      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <View className="flex-row items-center gap-xs">
          <StaffIcon size={14} color={colors.roastLight} />
          <Text className="text-xs font-medium text-text-secondary">従業員モチベーション(平均)</Text>
        </View>
        {avgMorale === null ? (
          <Text className="text-xs text-text-muted">配属中の従業員がいません</Text>
        ) : (
          <Gauge label="平均モチベーション" value={avgMorale} color={avgMorale >= 50 ? colors.positive : colors.negative} />
        )}
        {storeAlerts
          .filter((alert) => alert.code === 'low-morale')
          .map((alert) => (
            <View key={alert.code} className="flex-row items-start gap-xs">
              <WarningIcon size={12} color={colors.negative} />
              <Text className="flex-1 text-xs text-negative">{alert.message}</Text>
            </View>
          ))}
      </View>

      {!storeReport ? (
        <Text className="text-center text-xs text-text-muted">「ターンを進める」と今日の売上・客数が表示されます</Text>
      ) : null}
    </View>
  );
}
