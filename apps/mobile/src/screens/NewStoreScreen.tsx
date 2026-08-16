import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { cities, generatePropertiesForCity, type City, type Property } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { colors, spacing, typography } from '../theme/theme';

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
  const stores = useGameStore((store) => store.state.stores);
  const properties = useGameStore((store) => store.properties);

  const initialCity = cities.find((city) => city.id === route.params?.cityId) ?? null;
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity);

  const propertyOptions = useMemo(
    () => (selectedCity ? generatePropertiesForCity(selectedCity) : []),
    [selectedCity]
  );

  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties]);
  const ownedStoresInCity = useMemo(
    () =>
      selectedCity
        ? stores.filter((store) => propertyById.get(store.propertyId)?.cityId === selectedCity.id)
        : [],
    [selectedCity, stores, propertyById]
  );

  if (!selectedCity) {
    return (
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={cities}
        keyExtractor={(city) => city.id}
        renderItem={({ item: city }) => (
          <Pressable onPress={() => setSelectedCity(city)}>
            <Card style={styles.cardRow}>
              <Ionicons name="location" size={20} color={colors.roast} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.cityMeta}>{city.country} ・ 所得水準 {city.incomeLevel} / 10</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          </Pressable>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{selectedCity.name}の店舗マップ</Text>
      <FlatList
        contentContainerStyle={styles.content}
        data={propertyOptions}
        keyExtractor={(property) => property.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          ownedStoresInCity.length > 0 ? (
            <View style={styles.ownedRow}>
              {ownedStoresInCity.map((store) => (
                <View key={store.id} style={styles.ownedPin}>
                  <Ionicons name="cafe" size={14} color={colors.white} />
                  <Text style={styles.ownedPinLabel} numberOfLines={1}>
                    {store.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item: property }) => (
          <Card style={styles.propertyCard}>
            <View style={styles.vacantBadge}>
              <Ionicons name="location-outline" size={14} color={colors.mapVacant} />
              <Text style={styles.vacantBadgeText}>空き物件</Text>
            </View>
            <Text style={styles.cityName}>{SIZE_LABEL[property.size]}</Text>
            <Text style={styles.cityMeta}>足数 {property.footTraffic.toLocaleString('ja-JP')} / 月</Text>
            <Text style={styles.cityMeta}>賃料 ¥{property.rentPerMonth.toLocaleString('ja-JP')} / 月</Text>
            <AppButton
              label="出店する"
              icon="cafe"
              onPress={() => {
                openStore(property, `${selectedCity.name} ${SIZE_LABEL[property.size]}店`);
                navigation.goBack();
              }}
            />
          </Card>
        )}
      />
      <Pressable style={styles.backButton} onPress={() => setSelectedCity(null)}>
        <Text style={styles.backButtonText}>都市選択に戻る</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  row: { gap: spacing.sm },
  ownedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  ownedPin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 160,
    backgroundColor: colors.mapOwned,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ownedPinLabel: { fontSize: 12, fontWeight: '700', color: colors.white, flexShrink: 1 },
  vacantBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vacantBadgeText: { fontSize: 11, color: colors.mapVacant, fontWeight: '600' },
  sectionLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary, padding: spacing.md, paddingBottom: 0 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  propertyCard: { flex: 1, gap: 4 },
  cityName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  cityMeta: { fontSize: 13, color: colors.textSecondary },
  backButton: { alignItems: 'center', padding: spacing.md },
  backButtonText: { color: colors.roast, fontWeight: '600' },
});
