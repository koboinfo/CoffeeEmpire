import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { cities, evaluateFranchiseOpportunity, generatePropertiesForCity, type City, type Property } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { GridBackdrop } from '../components/GridBackdrop';
import { GlowBadge } from '../components/GlowBadge';
import { BuildingIcon, WarningIcon, CheckCircleIcon } from '../icons';
import { colors } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'NewStore'>;
type Route = RouteProp<RootStackParamList, 'NewStore'>;

const SIZE_LABEL: Record<Property['size'], string> = {
  kiosk: 'キオスク',
  small: '小規模',
  medium: '中規模',
  large: '大規模',
  flagship: '旗艦店',
};

export function NewStoreScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const openStore = useGameStore((store) => store.openStore);
  const openFranchise = useGameStore((store) => store.openFranchise);
  const stores = useGameStore((store) => store.state.stores);
  const properties = useGameStore((store) => store.properties);
  const competitorBrands = useGameStore((store) => store.state.competitorBrands);

  const initialCity = cities.find((city) => city.id === route.params?.cityId) ?? null;
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity);

  const propertyOptions = useMemo(
    () => (selectedCity ? generatePropertiesForCity(selectedCity) : []),
    [selectedCity]
  );

  // フランチャイズ契約の見積もり(客足×都市所得水準からの粗い見積もり)。都市選択時のみ計算する。
  const franchiseEvaluationByPropertyId = useMemo(
    () =>
      selectedCity
        ? new Map(propertyOptions.map((property) => [property.id, evaluateFranchiseOpportunity(property, selectedCity)]))
        : new Map(),
    [propertyOptions, selectedCity]
  );

  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties]);
  const ownedStoresInCity = useMemo(
    () =>
      selectedCity
        ? stores.filter((store) => propertyById.get(store.propertyId)?.cityId === selectedCity.id)
        : [],
    [selectedCity, stores, propertyById]
  );

  const competitorsInCity = useMemo(
    () =>
      selectedCity
        ? competitorBrands
            .map((brand) => ({ id: brand.id, name: brand.name, count: brand.storesByCity[selectedCity.id] ?? 0 }))
            .filter((brand) => brand.count > 0)
        : [],
    [selectedCity, competitorBrands]
  );

  if (!selectedCity) {
    return (
      <GridBackdrop className="flex-1">
        <FlatList
          contentContainerClassName="gap-sm p-md"
          data={cities}
          keyExtractor={(city) => city.id}
          renderItem={({ item: city }) => (
            <Pressable onPress={() => setSelectedCity(city)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <GlowBadge color={colors.roast} size={30}>
                  <BuildingIcon size={15} color={colors.white} />
                </GlowBadge>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-text-primary">{city.name}</Text>
                  <Text className="text-[13px] text-text-secondary">
                    {city.country} ・ 所得水準 {city.incomeLevel} / 10
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Card>
            </Pressable>
          )}
        />
      </GridBackdrop>
    );
  }

  return (
    <GridBackdrop className="flex-1">
      <Text className="p-md pb-0 text-[15px] font-semibold text-text-primary">{selectedCity.name}の店舗マップ</Text>
      <FlatList
        contentContainerClassName="gap-sm p-md"
        data={propertyOptions}
        keyExtractor={(property) => property.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 8 }}
        ListHeaderComponent={
          ownedStoresInCity.length > 0 || competitorsInCity.length > 0 ? (
            <View className="mb-sm gap-xs">
              {ownedStoresInCity.length > 0 ? (
                <View className="flex-row flex-wrap gap-xs">
                  {ownedStoresInCity.map((store) => (
                    <View
                      key={store.id}
                      className="max-w-[170px] flex-row items-center gap-xs rounded-full bg-map-owned px-sm py-xs"
                      style={{ shadowColor: colors.mapOwned, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 }}
                    >
                      <CheckCircleIcon size={12} color={colors.white} />
                      <Text className="flex-shrink text-xs font-bold text-white" numberOfLines={1}>
                        {store.name}
                      </Text>
                      <Text className="text-[10px] font-bold text-white/80">
                        {store.employeeIds.length < 2 ? '人手不足' : '営業中'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {competitorsInCity.length > 0 ? (
                <View className="flex-row flex-wrap gap-xs">
                  {competitorsInCity.map((brand) => (
                    <View key={brand.id} className="flex-row items-center gap-xs rounded-full border border-negative/40 bg-negative/15 px-sm py-xs">
                      <WarningIcon size={12} color={colors.negative} />
                      <Text className="text-xs font-bold text-negative">
                        {brand.name} ×{brand.count}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null
        }
        renderItem={({ item: property }) => (
          <Card style={{ flex: 1, gap: 4, borderColor: colors.mapVacant, borderWidth: 1 }}>
            <View className="flex-row items-center gap-xs">
              <GlowBadge color={colors.mapVacant} size={20}>
                <WarningIcon size={11} color={colors.white} />
              </GlowBadge>
              <Text className="text-[11px] font-semibold" style={{ color: colors.mapVacant }}>
                空き物件・For Rent
              </Text>
            </View>
            <Text className="text-[17px] font-bold text-text-primary">{SIZE_LABEL[property.size]}</Text>
            <View className="flex-row items-center gap-xs">
              <Ionicons name="walk" size={12} color={colors.textSecondary} />
              <Text className="text-xs font-semibold text-text-secondary">{property.footTraffic.toLocaleString('ja-JP')}人/月</Text>
            </View>
            <View className="flex-row items-center gap-xs">
              <Ionicons name="cash-outline" size={12} color={colors.gold} />
              <Text className="text-xs font-semibold text-text-secondary">¥{property.rentPerMonth.toLocaleString('ja-JP')}/月</Text>
            </View>
            <AppButton
              label="出店する"
              icon="cafe"
              onPress={() => {
                openStore(property, `${selectedCity.name} ${SIZE_LABEL[property.size]}店`);
                navigation.goBack();
              }}
            />
            {(() => {
              const franchiseEvaluation = franchiseEvaluationByPropertyId.get(property.id);
              if (!franchiseEvaluation) return null;
              return (
                <AppButton
                  label={`FC契約(月次ロイヤリティ見込 ¥${Math.round(
                    franchiseEvaluation.monthlyGrossRevenueEstimate * franchiseEvaluation.royaltyRate
                  ).toLocaleString('ja-JP')})`}
                  icon="people"
                  variant="secondary"
                  onPress={() => openFranchise(selectedCity, franchiseEvaluation)}
                />
              );
            })()}
          </Card>
        )}
      />
      <Pressable className="items-center p-md" onPress={() => setSelectedCity(null)}>
        <Text className="font-semibold" style={{ color: colors.roast }}>都市選択に戻る</Text>
      </Pressable>
    </GridBackdrop>
  );
}
