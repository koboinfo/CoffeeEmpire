import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { calculateCityMarketShare, cities } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GridBackdrop } from '../components/GridBackdrop';
import { GlowBadge } from '../components/GlowBadge';
import { BuildingIcon, WarningIcon } from '../icons';
import { getCityImage } from '../assets/images/registry';
import { colors } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/**
 * 実地図SDK(react-native-maps等)は未導入で、都市カードのグリッド一覧で代替する。
 * 実地図描画・ピン配置は将来のパフォーマンス最適化・外部連携で検討する。
 * 背景は GridBackdrop(グラデーション+パースグリッド+glow)。実写素材が
 * registry.ts に登録され次第そちらへ自動的に切り替わる。
 */
export function MapScreen() {
  const navigation = useNavigation<Navigation>();
  const stores = useGameStore((store) => store.state.stores);
  const properties = useGameStore((store) => store.properties);
  const competitorBrands = useGameStore((store) => store.state.competitorBrands);

  const propertyById = new Map(properties.map((property) => [property.id, property]));

  const storeCountByCity = new Map<string, number>();
  for (const store of stores) {
    const cityId = propertyById.get(store.propertyId)?.cityId;
    if (!cityId) continue;
    storeCountByCity.set(cityId, (storeCountByCity.get(cityId) ?? 0) + 1);
  }

  const competitorStoreCountByCity = new Map<string, number>();
  for (const competitor of competitorBrands) {
    for (const [cityId, count] of Object.entries(competitor.storesByCity)) {
      competitorStoreCountByCity.set(cityId, (competitorStoreCountByCity.get(cityId) ?? 0) + count);
    }
  }

  return (
    <GridBackdrop className="flex-1">
      <View className="px-md pt-md">
        <Text className="text-[20px] font-bold text-text-primary">ワールドマップ</Text>
        <Text className="mt-[2px] text-[13px] font-medium text-text-secondary">都市を選んで進出状況を確認</Text>
      </View>
      <FlatList
        contentContainerClassName="gap-sm p-md"
        data={cities}
        keyExtractor={(city) => city.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item: city }) => {
          const ownedCount = storeCountByCity.get(city.id) ?? 0;
          const competitorCount = competitorStoreCountByCity.get(city.id) ?? 0;
          const marketShare = calculateCityMarketShare(city.id, ownedCount, competitorBrands);
          const topShare = marketShare.find((entry) => entry.id === 'player');
          const cityImage = getCityImage(city.id);
          const isTerritory = ownedCount > 0;
          const isContested = competitorCount > ownedCount;

          return (
            <Pressable
              className="flex-1 overflow-hidden rounded-md border bg-surface"
              style={{
                borderColor: isTerritory ? colors.mapOwned : isContested ? colors.mapCompetitor : colors.border,
                shadowColor: isTerritory ? colors.mapOwned : isContested ? colors.mapCompetitor : '#000000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isTerritory || isContested ? 0.3 : 0.35,
                shadowRadius: isTerritory || isContested ? 10 : 8,
                elevation: 3,
              }}
              onPress={() => navigation.navigate('NewStore', { cityId: city.id })}
            >
              <GridBackdrop image={cityImage} className="h-16 justify-end p-sm" glowColor={isTerritory ? colors.mapOwned : colors.roast}>
                <View className="self-end">
                  <GlowBadge color={isTerritory ? colors.mapOwned : colors.roast} size={30}>
                    <BuildingIcon size={15} color={colors.white} />
                  </GlowBadge>
                </View>
              </GridBackdrop>

              <View className="gap-[4px] p-md">
                <Text className="text-base font-bold text-text-primary">{city.name}</Text>
                <Text className="text-xs text-text-secondary">{city.country}</Text>
                <Text className="text-xs text-text-secondary">所得水準 {city.incomeLevel} / 10</Text>

                <View className="mb-xs mt-xs flex-row flex-wrap items-center gap-sm">
                  <View className="flex-row items-center gap-[4px]">
                    <Ionicons name="walk" size={12} color={colors.textSecondary} />
                    <Text className="text-xs font-bold text-text-primary">
                      {Math.round(city.footTrafficIndex * 1000).toLocaleString('ja-JP')}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-[4px]">
                    <GlowBadge color={colors.mapOwned} size={18}>
                      <BuildingIcon size={10} color={colors.white} />
                    </GlowBadge>
                    <Text className="text-xs font-bold text-text-primary">{ownedCount}</Text>
                  </View>
                  <View className="flex-row items-center gap-[4px]">
                    <GlowBadge color={colors.mapCompetitor} size={18}>
                      <WarningIcon size={10} color={colors.white} />
                    </GlowBadge>
                    <Text className="text-xs font-bold text-text-primary">{competitorCount}</Text>
                  </View>
                </View>

                {topShare && topShare.storeCount > 0 ? (
                  <Text className="text-[11px] text-text-secondary">自社シェア {Math.round(topShare.share * 100)}%</Text>
                ) : isContested ? (
                  <Text className="text-[11px] font-semibold text-negative">競合が優勢な商圏</Text>
                ) : null}

                <View className="mt-xs flex-row items-center justify-between rounded-full border border-border bg-surface-alt px-sm py-xs">
                  <Text className="text-xs font-bold text-text-primary">都市を見る</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </GridBackdrop>
  );
}
