import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { cities, generatePropertiesForCity, evaluateRealEstateInvestment, type City } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { colors, spacing, typography } from '../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

export function RealEstateScreen() {
  const state = useGameStore((s) => s.state);
  const investInRealEstate = useGameStore((s) => s.investInRealEstate);

  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const propertyOptions = useMemo(
    () => (selectedCity ? generatePropertiesForCity(selectedCity) : []),
    [selectedCity]
  );

  const evaluationByPropertyId = useMemo(
    () => new Map(propertyOptions.map((property) => [property.id, evaluateRealEstateInvestment(property)])),
    [propertyOptions]
  );

  const ownedCount = state.ownedRealEstate.length;

  if (!selectedCity) {
    return (
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Text style={styles.sectionLabel}>保有中の不動産: {ownedCount}件</Text>}
        data={cities}
        keyExtractor={(city) => city.id}
        renderItem={({ item: city }) => (
          <Pressable onPress={() => setSelectedCity(city)}>
            <Card>
              <Text style={styles.cityName}>{city.name}</Text>
              <Text style={styles.cityMeta}>{city.country} ・ 所得水準 {city.incomeLevel} / 10</Text>
            </Card>
          </Pressable>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{selectedCity.name}の投資物件候補</Text>
      <FlatList
        contentContainerStyle={styles.content}
        data={propertyOptions}
        keyExtractor={(property) => property.id}
        renderItem={({ item: property }) => {
          const evaluation = evaluationByPropertyId.get(property.id)!;
          const affordable = state.cash >= evaluation.purchasePrice;
          return (
            <Card>
              <Text style={styles.cityName}>{property.size}</Text>
              <Text style={styles.cityMeta}>購入額 {formatCurrency(evaluation.purchasePrice)}</Text>
              <Text style={styles.cityMeta}>月次賃料収入 {formatCurrency(evaluation.monthlyRentalIncome)}</Text>
              <AppButton
                label="投資する"
                icon="cash"
                disabled={!affordable}
                onPress={() => investInRealEstate(property, evaluation)}
              />
            </Card>
          );
        }}
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
  sectionLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary, padding: spacing.md, paddingBottom: 0 },
  cityName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  cityMeta: { fontSize: 13, color: colors.textSecondary },
  backButton: { alignItems: 'center', padding: spacing.md },
  backButtonText: { color: colors.roast, fontWeight: '600' },
});
