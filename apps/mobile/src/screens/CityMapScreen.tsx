import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  cities,
  evaluateRealEstateInvestment,
  generatePropertiesForCity,
  resolvePropertyCapacity,
  RENT_PER_TSUBO_JPY,
  type Property,
} from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GridBackdrop } from '../components/GridBackdrop';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { GlowBadge } from '../components/GlowBadge';
import { BuildingIcon, WarningIcon, CheckCircleIcon } from '../icons';
import { getCityImage } from '../assets/images/registry';
import { getCityTheme } from '../theme/cityTheme';
import { colors } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'CityMap'>;
type Route = RouteProp<RootStackParamList, 'CityMap'>;

const SIZE_LABEL: Record<Property['size'], string> = {
  kiosk: 'キオスク',
  small: '小規模',
  medium: '中規模',
  large: '大規模',
  flagship: '旗艦店',
};

const BUILDING_HEIGHT: Record<Property['size'], number> = {
  kiosk: 46,
  small: 68,
  medium: 92,
  large: 110,
  flagship: 130,
};

// 3棟固定(kiosk/small/medium)を前提に、都市によらず一定のトライアングル配置にする(UI統一のため)。
const BUILDING_POSITION = [
  { left: '18%', bottom: '14%' },
  { left: '46%', bottom: '10%' },
  { left: '74%', bottom: '18%' },
] as const;

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

export function CityMapScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const city = cities.find((c) => c.id === route.params.cityId);

  const openStore = useGameStore((store) => store.openStore);
  const closeStore = useGameStore((store) => store.closeStore);
  const investInRealEstate = useGameStore((store) => store.investInRealEstate);
  const sellRealEstate = useGameStore((store) => store.sellRealEstate);
  const stores = useGameStore((store) => store.state.stores);
  const ownedRealEstate = useGameStore((store) => store.state.ownedRealEstate);
  const competitorBrands = useGameStore((store) => store.state.competitorBrands);
  const cash = useGameStore((store) => store.state.cash);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const propertyOptions = useMemo(
    () => (city ? generatePropertiesForCity(city, Math.random, RENT_PER_TSUBO_JPY) : []),
    [city]
  );

  const storeByPropertyId = useMemo(() => new Map(stores.map((store) => [store.propertyId, store])), [stores]);
  const realEstateByPropertyId = useMemo(
    () => new Map(ownedRealEstate.map((investment) => [investment.propertyId, investment])),
    [ownedRealEstate]
  );
  const evaluationByPropertyId = useMemo(
    () => new Map(propertyOptions.map((property) => [property.id, evaluateRealEstateInvestment(property)])),
    [propertyOptions]
  );

  const competitorsInCity = useMemo(
    () =>
      city
        ? competitorBrands
            .map((brand) => ({ id: brand.id, name: brand.name, count: brand.storesByCity[city.id] ?? 0 }))
            .filter((brand) => brand.count > 0)
        : [],
    [city, competitorBrands]
  );

  if (!city) {
    return (
      <GridBackdrop className="flex-1 items-center justify-center">
        <Text className="text-text-secondary">都市が見つかりません</Text>
      </GridBackdrop>
    );
  }

  const theme = getCityTheme(city.id);
  const cityImage = getCityImage(city.id);
  const selectedProperty = propertyOptions.find((property) => property.id === selectedPropertyId) ?? null;
  const selectedStore = selectedProperty ? storeByPropertyId.get(selectedProperty.id) : undefined;
  const selectedInvestment = selectedProperty ? realEstateByPropertyId.get(selectedProperty.id) : undefined;
  const selectedEvaluation = selectedProperty ? evaluationByPropertyId.get(selectedProperty.id) : undefined;

  return (
    <GridBackdrop className="flex-1">
      <ScrollView contentContainerClassName="pb-lg">
        <View className="px-md pt-md">
          <Text className="text-[20px] font-bold text-text-primary">
            {theme.landmarkEmoji} {city.name}
          </Text>
          <Text className="mt-[2px] text-[13px] font-medium text-text-secondary">
            {city.country} ・ 所得水準 {city.incomeLevel} / 10 ・ 客足指数 {Math.round(city.footTrafficIndex * 1000).toLocaleString('ja-JP')}
          </Text>
        </View>

        <View className="m-md h-[220px] overflow-hidden rounded-md border" style={{ borderColor: colors.border }}>
          <GridBackdrop image={cityImage} glowColor={theme.accentColor} style={{ flex: 1 }}>
            {propertyOptions.map((property, index) => {
              const position = BUILDING_POSITION[index] ?? BUILDING_POSITION[BUILDING_POSITION.length - 1];
              const store = storeByPropertyId.get(property.id);
              const investment = realEstateByPropertyId.get(property.id);
              const buildingColor = store ? colors.mapOwned : investment ? colors.gold : colors.mapVacant;
              const isSelected = property.id === selectedPropertyId;

              return (
                <Pressable
                  key={property.id}
                  onPress={() => setSelectedPropertyId(property.id)}
                  style={{
                    position: 'absolute',
                    left: position.left,
                    bottom: position.bottom,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: BUILDING_HEIGHT[property.size],
                      borderRadius: 6,
                      backgroundColor: buildingColor,
                      opacity: store || investment ? 0.9 : 0.55,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: colors.roast,
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      paddingTop: 6,
                      shadowColor: buildingColor,
                      shadowOpacity: 0.7,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 5,
                    }}
                  >
                    <BuildingIcon size={16} color={colors.white} />
                  </View>
                  <View className="mt-[4px] rounded-full bg-surface px-xs py-[2px]" style={{ borderWidth: 1, borderColor: colors.border }}>
                    <Text className="text-[10px] font-bold text-text-primary">{SIZE_LABEL[property.size]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </GridBackdrop>
        </View>

        {(propertyOptions.some((property) => storeByPropertyId.has(property.id)) || competitorsInCity.length > 0) && (
          <View className="mb-sm flex-row flex-wrap gap-xs px-md">
            {propertyOptions
              .map((property) => storeByPropertyId.get(property.id))
              .filter((store): store is NonNullable<typeof store> => !!store)
              .map((store) => (
                <View
                  key={store.id}
                  className="flex-row items-center gap-xs rounded-full bg-map-owned px-sm py-xs"
                  style={{ shadowColor: colors.mapOwned, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 }}
                >
                  <CheckCircleIcon size={12} color={colors.white} />
                  <Text className="text-xs font-bold text-white">{store.name}</Text>
                </View>
              ))}
            {competitorsInCity.map((brand) => (
              <View key={brand.id} className="flex-row items-center gap-xs rounded-full border border-negative/40 bg-negative/15 px-sm py-xs">
                <WarningIcon size={12} color={colors.negative} />
                <Text className="text-xs font-bold text-negative">
                  {brand.name} ×{brand.count}(都市集計)
                </Text>
              </View>
            ))}
          </View>
        )}

        {selectedProperty ? (
          <Card style={{ marginHorizontal: 16, gap: 8 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[17px] font-bold text-text-primary">{SIZE_LABEL[selectedProperty.size]}</Text>
              <Pressable onPress={() => setSelectedPropertyId(null)}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {selectedStore ? (
              <>
                <View className="flex-row items-center gap-xs">
                  <GlowBadge color={colors.mapOwned} size={20}>
                    <CheckCircleIcon size={11} color={colors.white} />
                  </GlowBadge>
                  <Text className="text-xs font-semibold" style={{ color: colors.mapOwned }}>
                    営業中・{selectedStore.name}
                  </Text>
                </View>
                <AppButton
                  label="店舗詳細を見る"
                  icon="storefront"
                  onPress={() => navigation.navigate('StoreDetail', { storeId: selectedStore.id })}
                />
                <AppButton
                  label="閉店して売却する"
                  icon="close-circle"
                  variant="secondary"
                  onPress={() => {
                    closeStore(selectedStore.id);
                    setSelectedPropertyId(null);
                  }}
                />
              </>
            ) : selectedInvestment ? (
              <>
                <View className="flex-row items-center gap-xs">
                  <Ionicons name="cash-outline" size={12} color={colors.gold} />
                  <Text className="text-xs font-semibold text-text-secondary">
                    月次賃料収入 {formatCurrency(selectedInvestment.monthlyRentalIncome)}
                  </Text>
                </View>
                <AppButton
                  label="この物件に出店する"
                  icon="cafe"
                  onPress={() => {
                    openStore(selectedProperty, `${city.name} ${SIZE_LABEL[selectedProperty.size]}店`);
                    setSelectedPropertyId(null);
                  }}
                />
                <AppButton
                  label={`売却する(${formatCurrency(selectedInvestment.purchasePrice * 0.9)})`}
                  icon="cash"
                  variant="secondary"
                  onPress={() => {
                    sellRealEstate(selectedInvestment.id);
                    setSelectedPropertyId(null);
                  }}
                />
              </>
            ) : (
              <>
                <View className="flex-row items-center gap-xs">
                  <Ionicons name="resize-outline" size={12} color={colors.textSecondary} />
                  <Text className="text-xs font-semibold text-text-secondary">
                    {resolvePropertyCapacity(selectedProperty).sizeTsubo}坪・席数{resolvePropertyCapacity(selectedProperty).seats}
                  </Text>
                </View>
                <View className="flex-row items-center gap-xs">
                  <Ionicons name="walk" size={12} color={colors.textSecondary} />
                  <Text className="text-xs font-semibold text-text-secondary">
                    {selectedProperty.footTraffic.toLocaleString('ja-JP')}人/月
                  </Text>
                </View>
                <View className="flex-row items-center gap-xs">
                  <Ionicons name="cash-outline" size={12} color={colors.gold} />
                  <Text className="text-xs font-semibold text-text-secondary">
                    賃料 {formatCurrency(selectedProperty.rentPerMonth)}/月
                  </Text>
                </View>
                <AppButton
                  label="借りる(出店する)"
                  icon="cafe"
                  onPress={() => {
                    openStore(selectedProperty, `${city.name} ${SIZE_LABEL[selectedProperty.size]}店`);
                    setSelectedPropertyId(null);
                  }}
                />
                {selectedEvaluation ? (
                  <AppButton
                    label={`買う(投資用・${formatCurrency(selectedEvaluation.purchasePrice)})`}
                    icon="business"
                    variant="secondary"
                    disabled={cash < selectedEvaluation.purchasePrice}
                    onPress={() => {
                      investInRealEstate(selectedProperty, selectedEvaluation);
                      setSelectedPropertyId(null);
                    }}
                  />
                ) : null}
              </>
            )}
          </Card>
        ) : (
          <Text className="px-md text-[12px] text-text-secondary">建物をタップして詳細を表示</Text>
        )}
      </ScrollView>
    </GridBackdrop>
  );
}
