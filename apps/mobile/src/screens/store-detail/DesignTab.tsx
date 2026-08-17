import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { calculateInteriorQualityFactor, equipmentCatalog, type EquipmentTemplate, type Store } from '@coffee-empire/core';
import { ChairIcon, EspressoMachineIcon, GearIcon } from '../../icons';
import { colors } from '../../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="mb-xs flex-row items-center gap-xs">
      {icon}
      <Text className="text-[13px] font-medium text-text-secondary">{label}</Text>
    </View>
  );
}

const TIER_META: Record<number, { name: string; color: string }> = {
  1: { name: 'ブロンズ', color: '#B08D57' },
  2: { name: 'シルバー', color: '#C7CDD6' },
  3: { name: 'ゴールド', color: colors.gold },
};

function tierMeta(tier: number) {
  return TIER_META[tier] ?? { name: `Tier ${tier}`, color: colors.roastLight };
}

function categoryIcon(category: string) {
  if (category === 'furniture') return ChairIcon;
  if (category === 'espressoMachine' || category === 'roaster') return EspressoMachineIcon;
  return GearIcon;
}

function TierBadge({ tier }: { tier: number }) {
  const meta = tierMeta(tier);
  return (
    <View
      className="flex-row items-center gap-[3px] self-start rounded-full px-sm py-[2px]"
      style={{ backgroundColor: `${meta.color}26`, borderWidth: 1, borderColor: meta.color }}
    >
      <Text className="text-[10px] font-bold" style={{ color: meta.color }}>
        {meta.name} ・ Tier {tier}
      </Text>
    </View>
  );
}

interface DesignTabProps {
  store: Store;
  cash: number;
  purchaseEquipment: (storeId: string, template: EquipmentTemplate) => void;
  sellEquipment: (storeId: string, equipmentId: string) => void;
}

export function DesignTab({ store, cash, purchaseEquipment, sellEquipment }: DesignTabProps) {
  const interiorFactor = calculateInteriorQualityFactor(store.equipment);

  return (
    <View className="gap-md">
      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <SectionLabel icon={<GearIcon size={15} color={colors.roastLight} />} label={`導入済み機材(${store.equipment.length}件)`} />
        {interiorFactor > 1 ? (
          <View className="flex-row items-center gap-xs rounded-sm px-sm py-xs" style={{ backgroundColor: 'rgba(95,190,114,0.14)' }}>
            <ChairIcon size={13} color={colors.positive} />
            <Text className="text-xs font-semibold text-positive">座席・内装ボーナス: 売上 +{Math.round((interiorFactor - 1) * 100)}%</Text>
          </View>
        ) : (
          <Text className="text-xs text-text-muted">座席・内装(furniture)機材を導入すると売上にボーナスが付きます</Text>
        )}
        {store.equipment.length === 0 ? <Text className="text-xs text-text-muted">まだ機材がありません</Text> : null}
        {store.equipment.map((equipment, index) => {
          const CategoryIcon = categoryIcon(equipment.category);
          const meta = tierMeta(equipment.tier);
          return (
            <View
              key={equipment.id}
              className={`flex-row items-center justify-between py-sm ${index === 0 ? '' : 'border-t border-border'}`}
            >
              <View className="flex-row items-center gap-sm">
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${meta.color}26` }}
                >
                  <CategoryIcon size={18} color={meta.color} />
                </View>
                <View className="gap-[2px]">
                  <Text className="text-sm text-text-primary">{equipment.category}</Text>
                  <TierBadge tier={equipment.tier} />
                </View>
              </View>
              <Pressable onPress={() => sellEquipment(store.id, equipment.id)}>
                <Text className="text-xs font-semibold text-negative">売却</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <SectionLabel icon={<EspressoMachineIcon size={15} color={colors.roastLight} />} label="機材カタログ(購入・入れ替え)" />
        {equipmentCatalog.map((template, index) => {
          const affordable = cash >= template.purchaseCost;
          const CategoryIcon = categoryIcon(template.category);
          const meta = tierMeta(template.tier);
          return (
            <Pressable
              key={template.templateId}
              className={`flex-row items-center justify-between py-sm ${index === 0 ? '' : 'border-t border-border'} ${affordable ? '' : 'opacity-40'}`}
              disabled={!affordable}
              onPress={() => purchaseEquipment(store.id, template)}
            >
              <View className="flex-row items-center gap-sm">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${meta.color}26` }}>
                  <CategoryIcon size={18} color={meta.color} />
                </View>
                <View className="gap-[2px]">
                  <Text className="text-sm text-text-primary">{template.name}</Text>
                  <TierBadge tier={template.tier} />
                </View>
              </View>
              <Text className="text-sm font-semibold text-text-primary">{formatCurrency(template.purchaseCost)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
