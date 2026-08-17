import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { RoastBatch, Store } from '@coffee-empire/core';
import { CalendarIcon, ChartIcon, GearIcon } from '../../icons';
import { colors } from '../../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

const PRICE_STEP = 50;

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="mb-xs flex-row items-center gap-xs">
      {icon}
      <Text className="text-[13px] font-medium text-text-secondary">{label}</Text>
    </View>
  );
}

function Stepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View className="flex-row items-center gap-sm">
      <Pressable
        className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        onPress={onDecrement}
      >
        <Text className="text-base font-bold text-text-primary">-</Text>
      </Pressable>
      <Text className="min-w-[64px] text-center text-base font-bold text-text-primary">{value}</Text>
      <Pressable
        className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        onPress={onIncrement}
      >
        <Text className="text-base font-bold text-text-primary">+</Text>
      </Pressable>
    </View>
  );
}

/** 営業時間の長さに応じた簡易な売上プレビュー係数(±10%を目安に線形近似)。実際の計算式(financials.ts)を呼ばず、体感的な増減の方向性のみを示す。 */
function previewHoursDelta(currentHours: number, baselineHours: number): number {
  if (baselineHours <= 0) return 0;
  return (currentHours - baselineHours) / baselineHours;
}

interface OperationsTabProps {
  store: Store;
  roastedInventory: RoastBatch[];
  setMenuItemPrice: (storeId: string, menuItemId: string, price: number) => void;
  applyRoastedBatchToMenuItem: (storeId: string, menuItemId: string, batchId: string) => void;
  setOperatingHours: (storeId: string, open: number, close: number) => void;
}

export function OperationsTab({
  store,
  roastedInventory,
  setMenuItemPrice,
  applyRoastedBatchToMenuItem,
  setOperatingHours,
}: OperationsTabProps) {
  const [pickingBatchForMenuItemId, setPickingBatchForMenuItemId] = useState<string | null>(null);
  const { open, close } = store.operatingHours;
  const hoursOpen = Math.max(0, close - open);
  const hoursDelta = previewHoursDelta(hoursOpen, 10);

  return (
    <View className="gap-md">
      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <SectionLabel icon={<CalendarIcon size={15} color={colors.roastLight} />} label="営業時間" />
        <View className="flex-row items-center justify-center gap-md">
          <Stepper
            value={`${open}:00`}
            onDecrement={() => setOperatingHours(store.id, Math.max(0, open - 1), close)}
            onIncrement={() => setOperatingHours(store.id, Math.min(close - 1, open + 1), close)}
          />
          <Text className="text-sm text-text-muted">〜</Text>
          <Stepper
            value={`${close}:00`}
            onDecrement={() => setOperatingHours(store.id, open, Math.max(open + 1, close - 1))}
            onIncrement={() => setOperatingHours(store.id, open, Math.min(24, close + 1))}
          />
        </View>
        <View
          className="mt-xs flex-row items-center justify-between rounded-sm px-sm py-xs"
          style={{ backgroundColor: hoursDelta >= 0 ? 'rgba(95,190,114,0.14)' : 'rgba(226,86,75,0.14)' }}
        >
          <Text className="text-xs text-text-secondary">1日{hoursOpen}時間営業 ・ 予測売上への影響(目安)</Text>
          <Text className="text-xs font-bold" style={{ color: hoursDelta >= 0 ? colors.positive : colors.negative }}>
            {hoursDelta >= 0 ? '+' : ''}
            {Math.round(hoursDelta * 100)}%
          </Text>
        </View>
      </View>

      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <SectionLabel icon={<GearIcon size={15} color={colors.roastLight} />} label="メニュー" />
        {store.menu.map((item, index) => {
          const isPicking = pickingBatchForMenuItemId === item.id;
          const margin = item.currentPrice > 0 ? (item.currentPrice - item.costOfGoods) / item.currentPrice : 0;

          return (
            <View key={item.id} className={`py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
              <View className="flex-row items-center justify-between">
                <Text className="flex-shrink text-sm text-text-primary">{item.name}</Text>
                <Stepper
                  value={formatCurrency(item.currentPrice)}
                  onDecrement={() => setMenuItemPrice(store.id, item.id, Math.max(0, item.currentPrice - PRICE_STEP))}
                  onIncrement={() => setMenuItemPrice(store.id, item.id, item.currentPrice + PRICE_STEP)}
                />
              </View>
              <View className="mt-xs flex-row items-center justify-between">
                <Text className="text-xs text-text-muted">
                  原価 {formatCurrency(item.costOfGoods)} / 品質 {item.qualityScore}
                </Text>
                <View className="flex-row items-center gap-[2px]">
                  <ChartIcon size={11} color={margin >= 0 ? colors.positive : colors.negative} />
                  <Text className="text-xs font-semibold" style={{ color: margin >= 0 ? colors.positive : colors.negative }}>
                    粗利 {Math.round(margin * 100)}%
                  </Text>
                </View>
              </View>
              <Pressable className="py-xs" onPress={() => setPickingBatchForMenuItemId(isPicking ? null : item.id)}>
                <Text className="text-xs font-semibold text-roast">焙煎豆を適用</Text>
              </Pressable>
              {isPicking ? (
                roastedInventory.length === 0 ? (
                  <Text className="text-xs text-text-muted">適用可能な焙煎後在庫がありません</Text>
                ) : (
                  roastedInventory.map((batch) => (
                    <Pressable
                      key={batch.id}
                      className="flex-row items-center justify-between border-t border-border py-sm"
                      onPress={() => {
                        applyRoastedBatchToMenuItem(store.id, item.id, batch.id);
                        setPickingBatchForMenuItemId(null);
                      }}
                    >
                      <Text className="text-sm text-text-primary">
                        {batch.roastLevel} {batch.outputKg}kg
                      </Text>
                      <Text className="text-sm font-semibold text-text-primary">品質{batch.qualityScore}</Text>
                    </Pressable>
                  ))
                )
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
