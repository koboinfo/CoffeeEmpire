import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Store } from '@coffee-empire/core';
import { GridBackdrop } from './GridBackdrop';
import { GlowBadge } from './GlowBadge';
import { BuildingIcon, ChartIcon, CheckCircleIcon, ChevronRightIcon, StaffIcon, StarIcon } from '../icons';
import { colors } from '../theme/theme';

interface StoreCardProps {
  store: Store;
  cityName?: string;
  onPress: () => void;
}

/**
 * 「自分がその土地のテナントを所有している」感覚を伝えるビジュアル重視の店舗カード。
 * ヘッダーは GridBackdrop(実写未配置時はグラデーション+グリッド)、所有バッジはglow付き。
 */
export function StoreCard({ store, cityName, onPress }: StoreCardProps) {
  const filledStars = Math.max(0, Math.min(5, Math.round(store.cumulativeCustomerSatisfaction / 20)));

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-md border border-border bg-surface"
      style={{
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <GridBackdrop style={{ height: 72, padding: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View className="flex-row items-center gap-xs rounded-full bg-black/40 px-sm py-xs">
          <CheckCircleIcon size={12} color={colors.positive} />
          <Text className="text-[11px] font-bold text-text-primary">所有中</Text>
        </View>
        <GlowBadge color={colors.roast} size={36}>
          <BuildingIcon size={18} color={colors.white} />
        </GlowBadge>
      </GridBackdrop>

      <View className="gap-xs p-md">
        <Text className="text-lg font-bold text-text-primary" numberOfLines={1}>
          {store.name}
        </Text>
        {cityName ? <Text className="text-xs text-text-secondary">{cityName}</Text> : null}

        <View className="mt-xs flex-row items-center gap-[2px]">
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} size={14} filled={i < filledStars} color={i < filledStars ? colors.gold : colors.textMuted} />
          ))}
        </View>

        <View className="mt-xs flex-row items-center justify-between">
          <View className="flex-row items-center gap-md">
            <View className="flex-row items-center gap-[4px]">
              <ChartIcon size={13} color={colors.textSecondary} />
              <Text className="text-xs font-semibold text-text-primary">メニュー{store.menu.length}</Text>
            </View>
            <View className="flex-row items-center gap-[4px]">
              <StaffIcon size={13} color={colors.textSecondary} />
              <Text className="text-xs font-semibold text-text-primary">従業員{store.employeeIds.length}</Text>
            </View>
          </View>
          <ChevronRightIcon size={16} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}
