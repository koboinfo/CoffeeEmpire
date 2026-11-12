import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import {
  cities,
  generatePropertiesForCity,
  evaluateRealEstateInvestment,
  RENT_PER_TSUBO_JPY,
  type City,
} from '@coffee-empire/core';
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
  const sellRealEstate = useGameStore((s) => s.sellRealEstate);

  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const propertyOptions = useMemo(
    () => (selectedCity ? generatePropertiesForCity(selectedCity, Math.random, RENT_PER_TSUBO_JPY) : []),
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
        ListHeaderComponent={
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.sectionLabel}>保有中の不動産: {ownedCount}件</Text>
            {state.ownedRealEstate.map((investment) => {
              const landValue = investment.landValue ?? investment.purchasePrice;
              const unrealizedGain = landValue - investment.purchasePrice;
              return (
                <Card key={investment.id}>
                  <Text style={styles.cityName}>月次賃料収入 {formatCurrency(investment.monthlyRentalIncome)}</Text>
                  <Text style={styles.cityMeta}>
                    購入額 {formatCurrency(investment.purchasePrice)} ・ 現在の地価 {formatCurrency(landValue)}
                  </Text>
                  <Text style={[styles.cityMeta, unrealizedGain >= 0 ? styles.gainPositive : styles.gainNegative]}>
                    含み損益 {unrealizedGain >= 0 ? '+' : ''}
                    {formatCurrency(unrealizedGain)}
                  </Text>
                  <AppButton
                    label={`売却する(${formatCurrency(Math.round(landValue * 0.9))})`}
                    icon="cash-outline"
                    variant="secondary"
                    onPress={() => sellRealEstate(investment.id)}
                  />
                </Card>
              );
            })}
          </View>
        }
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
  gainPositive: { color: colors.positive, fontWeight: '600' },
  gainNegative: { color: colors.negative, fontWeight: '600' },
});
