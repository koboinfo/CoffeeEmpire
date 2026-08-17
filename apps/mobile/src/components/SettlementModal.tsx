import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { AppModal } from './Modal';
import { AppButton } from './AppButton';
import { BanknoteIcon, WarningIcon } from '../icons';
import { colors } from '../theme/theme';

const BREAKDOWN_LABELS: Record<string, string> = {
  incomeTax: '所得税(累進課税)',
  residentTax: '住民税',
  businessTax: '個人事業税',
  corporateTax: '法人税',
  corporateInhabitantTaxMinimum: '法人住民税(均等割)',
};

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

/** 年1回の決算(SETTLEMENT_INTERVAL_TURNS=12ターンごと)で発生する一括納税の内訳を通知するモーダル。 */
export function SettlementModal() {
  const settlement = useGameStore((s) => s.latestSettlement);
  const dismissSettlement = useGameStore((s) => s.dismissSettlement);
  const isBankrupt = useGameStore((s) => s.state.isBankrupt);

  if (!settlement || isBankrupt) return null;

  const isDeficit = settlement.pretaxIncomeForPeriod < 0;

  return (
    <AppModal
      visible
      onClose={dismissSettlement}
      title="決算・納税通知"
      tone={isDeficit ? 'urgent' : 'default'}
      footer={<AppButton label="確認した" icon="checkmark-circle" onPress={dismissSettlement} />}
    >
      <View className="flex-row items-center gap-sm rounded-sm bg-surface-alt p-sm">
        <BanknoteIcon size={20} color={colors.gold} />
        <View className="flex-1">
          <Text className="text-xs text-text-secondary">決算期間の税引前利益</Text>
          <Text className="text-lg font-bold" style={{ color: isDeficit ? colors.negative : colors.textPrimary }}>
            {formatCurrency(settlement.pretaxIncomeForPeriod)}
          </Text>
        </View>
      </View>

      {isDeficit ? (
        <View className="flex-row items-center gap-xs rounded-sm p-sm" style={{ backgroundColor: 'rgba(226,86,75,0.14)' }}>
          <WarningIcon size={14} color={colors.negative} />
          <Text className="flex-1 text-xs font-semibold text-negative">
            赤字決算でも均等割等は必ず発生します。手元資金が不足すると黒字倒産のリスクがあります。
          </Text>
        </View>
      ) : null}

      <View className="gap-[2px] rounded-md border border-border bg-surface p-md">
        {Object.entries(settlement.breakdown).map(([key, value], index) => (
          <View key={key} className={`flex-row items-center justify-between py-xs ${index === 0 ? '' : 'border-t border-border'}`}>
            <Text className="text-xs text-text-secondary">{BREAKDOWN_LABELS[key] ?? key}</Text>
            <Text className="text-xs font-semibold text-text-primary">{formatCurrency(value)}</Text>
          </View>
        ))}
        <View className="mt-[2px] flex-row items-center justify-between border-t border-border pt-xs">
          <Text className="text-sm font-bold text-text-primary">納税額合計</Text>
          <Text className="text-sm font-extrabold" style={{ color: colors.negative }}>
            -{formatCurrency(settlement.totalTaxDue)}
          </Text>
        </View>
      </View>

      {settlement.isConsumptionTaxable ? (
        <Text className="text-[11px] text-text-muted">
          直近12ヶ月の売上高が基準を超えたため、次期以降は消費税の課税事業者になります。
        </Text>
      ) : null}
    </AppModal>
  );
}
