import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { calculateCityMarketShare, cities } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { colors, spacing, typography, radius } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/**
 * 実地図SDK(react-native-maps等)は未導入で、都市カードのグリッド一覧で代替する。
 * 実地図描画・ピン配置は将来のパフォーマンス最適化・外部連携で検討する。
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ワールドマップ</Text>
        <Text style={styles.subtitle}>都市を選んで進出状況を確認</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.content}
        data={cities}
        keyExtractor={(city) => city.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item: city }) => {
          const ownedCount = storeCountByCity.get(city.id) ?? 0;
          const competitorCount = competitorStoreCountByCity.get(city.id) ?? 0;
          const marketShare = calculateCityMarketShare(city.id, ownedCount, competitorBrands);
          const topShare = marketShare.find((entry) => entry.id === 'player');

          return (
            <Card style={styles.card}>
              <View style={styles.pinBadge}>
                <Ionicons name="location" size={16} color={colors.white} />
              </View>
              <Text style={styles.cityName}>{city.name}</Text>
              <Text style={styles.cityMeta}>{city.country}</Text>
              <Text style={styles.cityMeta}>所得水準 {city.incomeLevel} / 10</Text>

              <View style={styles.iconRow}>
                <View style={styles.iconStat}>
                  <View style={[styles.dot, { backgroundColor: colors.mapOwned }]} />
                  <Text style={styles.iconStatText}>{ownedCount}</Text>
                </View>
                <View style={styles.iconStat}>
                  <View style={[styles.dot, { backgroundColor: colors.mapCompetitor }]} />
                  <Text style={styles.iconStatText}>{competitorCount}</Text>
                </View>
                {topShare && topShare.storeCount > 0 ? (
                  <Text style={styles.shareText}>自社シェア {Math.round(topShare.share * 100)}%</Text>
                ) : null}
              </View>

              <AppButton
                label="都市を見る"
                icon="chevron-forward"
                variant="secondary"
                onPress={() => navigation.navigate('NewStore', { cityId: city.id })}
              />
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, paddingBottom: 0 },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.label, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.md, gap: spacing.sm },
  row: { gap: spacing.sm },
  card: { flex: 1, gap: 4, position: 'relative' },
  pinBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.roast,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, paddingRight: 30 },
  cityMeta: { fontSize: 12, color: colors.textSecondary },
  iconRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4, marginBottom: spacing.xs },
  iconStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  iconStatText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  shareText: { fontSize: 11, color: colors.textSecondary },
});
