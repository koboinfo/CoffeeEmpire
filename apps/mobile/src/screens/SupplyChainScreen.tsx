import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  calculateEffectiveBeanPrice,
  calculateFarmAcquisitionPrice,
  farms,
  type Farm,
  type RoastLevel,
} from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { GridBackdrop } from '../components/GridBackdrop';
import { getOriginImage } from '../assets/images/registry';
import { colors, spacing, radius, typography } from '../theme/theme';

function OriginThumb({ country }: { country: string }) {
  const originImage = getOriginImage(country);
  return (
    <GridBackdrop image={originImage} style={styles.originThumb}>
      <Ionicons name="leaf" size={14} color={colors.roastLight} />
    </GridBackdrop>
  );
}

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

const FLAVOR_LABELS: { key: keyof Farm['flavor']; label: string }[] = [
  { key: 'aroma', label: '香り' },
  { key: 'acidity', label: '酸味' },
  { key: 'bitterness', label: '苦味' },
];

function FlavorBars({ flavor }: { flavor: Farm['flavor'] }) {
  return (
    <View style={styles.flavorRow}>
      {FLAVOR_LABELS.map(({ key, label }) => (
        <View key={key} style={styles.flavorItem}>
          <Text style={styles.flavorLabel}>{label}</Text>
          <View style={styles.flavorTrack}>
            <View style={[styles.flavorFill, { width: `${flavor[key]}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function PriceTrend({ basePrice, effectivePrice }: { basePrice: number; effectivePrice: number }) {
  const diffRate = effectivePrice / basePrice - 1;
  if (Math.abs(diffRate) < 0.01) return null;
  const isUp = diffRate > 0;
  return (
    <View style={styles.priceTrendRow}>
      <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={12} color={isUp ? colors.negative : colors.positive} />
      <Text style={[styles.priceTrendText, { color: isUp ? colors.negative : colors.positive }]}>
        {isUp ? '+' : ''}
        {Math.round(diffRate * 100)}%
      </Text>
    </View>
  );
}

const KG_PRESETS = [50, 100, 200];
const ROAST_LEVELS: { level: RoastLevel; label: string }[] = [
  { level: 'light', label: '浅煎り' },
  { level: 'medium', label: '中煎り' },
  { level: 'darkMedium', label: '中深煎り' },
  { level: 'dark', label: '深煎り' },
];

function SectionLabel({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.roastLight} />
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export function SupplyChainScreen() {
  const state = useGameStore((s) => s.state);
  const establishRoastery = useGameStore((s) => s.establishRoastery);
  const purchaseBeans = useGameStore((s) => s.purchaseBeans);
  const roastLot = useGameStore((s) => s.roastLot);
  const acquireFarm = useGameStore((s) => s.acquireFarm);
  const roastBlend = useGameStore((s) => s.roastBlend);

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [blendSelectedLotIds, setBlendSelectedLotIds] = useState<string[]>([]);
  const [blendName, setBlendName] = useState('');
  const roastery = state.roasteries[0];

  const toggleBlendLot = (lotId: string) => {
    setBlendSelectedLotIds((current) =>
      current.includes(lotId) ? current.filter((id) => id !== lotId) : [...current, lotId]
    );
  };

  const executeBlend = (roastLevel: RoastLevel) => {
    if (!roastery || blendSelectedLotIds.length < 2 || !blendName.trim()) return;
    const inputs = blendSelectedLotIds
      .map((lotId) => state.greenBeanInventory.find((lot) => lot.id === lotId))
      .filter((lot): lot is NonNullable<typeof lot> => !!lot)
      .map((lot) => ({ lotId: lot.id, kg: lot.kg }));
    roastBlend(roastery.id, inputs, roastLevel, blendName.trim());
    setBlendSelectedLotIds([]);
    setBlendName('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>仕入れ・焙煎</Text>

      <Card>
        <SectionLabel icon="flame" label="焙煎所" />
        {roastery ? (
          <Text style={styles.rowLabel}>焙煎能力 {roastery.capacityKgPerMonth}kg / 月</Text>
        ) : (
          <AppButton label={`焙煎所を設立する(${formatCurrency(15000)})`} icon="hammer" onPress={establishRoastery} />
        )}
      </Card>

      <Card>
        <SectionLabel icon="leaf" label="農園から生豆を仕入れる" />
        {farms.map((farm) => {
          const effectivePrice = calculateEffectiveBeanPrice(farm, state.turn);
          return (
            <View key={farm.id} style={styles.farmRow}>
              <View style={styles.farmRowHeader}>
                <OriginThumb country={farm.country} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>
                    {farm.country} (Q{farm.qGrade})
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.subLabel}>
                      {formatCurrency(effectivePrice)}/kg ・ 供給安定性 {farm.reliability}%
                    </Text>
                    <PriceTrend basePrice={farm.pricePerKg} effectivePrice={effectivePrice} />
                  </View>
                </View>
              </View>
              <FlavorBars flavor={farm.flavor} />
              <View style={styles.presetRow}>
                {KG_PRESETS.map((kg) => (
                  <Pressable key={kg} style={styles.presetButton} onPress={() => purchaseBeans(farm.id, kg)}>
                    <Text style={styles.presetButtonText}>{kg}kg</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <SectionLabel icon="planet" label={`自社農園(${state.ownedFarms.length}件保有)`} />
        {state.ownedFarms.map((ownedFarm) => {
          const farm = farms.find((f) => f.id === ownedFarm.farmId);
          return (
            <View key={ownedFarm.id} style={styles.catalogRow}>
              <View style={styles.farmRowHeader}>
                {farm ? <OriginThumb country={farm.country} /> : null}
                <Text style={styles.rowLabel}>{farm?.country ?? ownedFarm.farmId}</Text>
              </View>
              {ownedFarm.lastHarvestFailed ? (
                <View style={styles.failureBadge}>
                  <Ionicons name="warning" size={12} color={colors.negative} />
                  <Text style={styles.failureBadgeText}>前ターン不作</Text>
                </View>
              ) : (
                <Text style={styles.rowValue}>収穫中</Text>
              )}
            </View>
          );
        })}
        <Text style={styles.subLabel}>
          買収すると毎ターン自動収穫(市場価格の約1割の維持費のみ)。天候リスクで稀に不作になる。
        </Text>
        {farms
          .filter((farm) => !state.ownedFarms.some((owned) => owned.farmId === farm.id))
          .map((farm) => {
            const price = calculateFarmAcquisitionPrice(farm, state.turn);
            const affordable = state.cash >= price;
            return (
              <Pressable
                key={farm.id}
                style={[styles.catalogRow, !affordable && styles.catalogRowDisabled]}
                disabled={!affordable}
                onPress={() => acquireFarm(farm.id)}
              >
                <Text style={styles.rowLabel}>{farm.country}農園を買収</Text>
                <Text style={styles.rowValue}>{formatCurrency(price)}</Text>
              </Pressable>
            );
          })}
      </Card>

      <Card>
        <SectionLabel icon="cube" label={`生豆在庫(${state.greenBeanInventory.length}ロット)`} />
        {state.greenBeanInventory.map((lot) => {
          const farm = farms.find((f) => f.id === lot.farmId);
          const isSelected = selectedLotId === lot.id;
          return (
            <View key={lot.id}>
              <Pressable
                style={styles.catalogRow}
                onPress={() => setSelectedLotId(isSelected ? null : lot.id)}
                disabled={!roastery}
              >
                <Text style={styles.rowLabel}>
                  {farm?.country ?? lot.farmId} Q{lot.qGrade}
                </Text>
                <Text style={styles.rowValue}>{lot.kg}kg</Text>
              </Pressable>
              {isSelected && roastery ? (
                <View style={styles.roastLevelRow}>
                  {ROAST_LEVELS.map(({ level, label }) => (
                    <Pressable
                      key={level}
                      style={styles.roastLevelButton}
                      onPress={() => {
                        roastLot(roastery.id, lot.id, level);
                        setSelectedLotId(null);
                      }}
                    >
                      <Text style={styles.roastLevelButtonText}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
        {!roastery ? <Text style={styles.subLabel}>焙煎するには焙煎所の設立が必要です</Text> : null}
      </Card>

      {roastery && state.greenBeanInventory.length >= 2 ? (
        <Card>
          <SectionLabel icon="color-filter" label="オリジナルブレンドを作る" />
          <Text style={styles.subLabel}>複数のロットを選んで配合し、独自ブランド豆として焙煎する(各ロットは全量投入)。</Text>
          {state.greenBeanInventory.map((lot) => {
            const farm = farms.find((f) => f.id === lot.farmId);
            const checked = blendSelectedLotIds.includes(lot.id);
            return (
              <Pressable key={lot.id} style={styles.catalogRow} onPress={() => toggleBlendLot(lot.id)}>
                <View style={styles.blendCheckboxRow}>
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={checked ? colors.roast : colors.textMuted}
                  />
                  <Text style={styles.rowLabel}>
                    {farm?.country ?? lot.farmId} Q{lot.qGrade}
                  </Text>
                </View>
                <Text style={styles.rowValue}>{lot.kg}kg</Text>
              </Pressable>
            );
          })}
          <TextInput
            style={styles.blendNameInput}
            placeholder="ブランド名(例: シグネチャーブレンド)"
            placeholderTextColor={colors.textMuted}
            value={blendName}
            onChangeText={setBlendName}
          />
          {blendSelectedLotIds.length >= 2 && blendName.trim() ? (
            <View style={styles.roastLevelRow}>
              {ROAST_LEVELS.map(({ level, label }) => (
                <Pressable key={level} style={styles.roastLevelButton} onPress={() => executeBlend(level)}>
                  <Text style={styles.roastLevelButtonText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.subLabel}>2ロット以上選択し、ブランド名を入力してください</Text>
          )}
        </Card>
      ) : null}

      <Card>
        <SectionLabel icon="checkmark-done" label={`焙煎後在庫(${state.roastedInventory.length}バッチ)`} />
        {state.roastedInventory.map((batch) => (
          <View key={batch.id} style={styles.catalogRow}>
            <Text style={styles.rowLabel}>
              {batch.blendName ? `${batch.blendName} ・ ` : ''}
              {ROAST_LEVELS.find((r) => r.level === batch.roastLevel)?.label} {batch.outputKg}kg
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rowValue}>顧客訴求スコア{batch.qualityScore}</Text>
              {batch.originCountries && batch.originCountries.length > 0 ? (
                <Text style={styles.subLabel}>
                  {batch.blend.length > 1 ? 'オリジナルブレンド' : 'シングルオリジン'} ・ {batch.originCountries.join(' x ')}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.title, color: colors.textPrimary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  cardLabel: { ...typography.label, color: colors.textSecondary },
  rowLabel: { fontSize: 14, color: colors.textPrimary },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  subLabel: { fontSize: 12, color: colors.textMuted },
  farmRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
  farmRowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  originThumb: { height: 32, width: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  priceTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  priceTrendText: { fontSize: 11, fontWeight: '600' },
  flavorRow: { flexDirection: 'row', gap: spacing.sm },
  flavorItem: { flex: 1, gap: 2 },
  flavorLabel: { fontSize: 10, color: colors.textMuted },
  flavorTrack: { height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  flavorFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.roast },
  presetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  presetButton: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  presetButtonText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  catalogRowDisabled: { opacity: 0.4 },
  roastLevelRow: { flexDirection: 'row', gap: 6, paddingBottom: spacing.sm },
  roastLevelButton: { flex: 1, backgroundColor: colors.roast, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  roastLevelButtonText: { fontSize: 11, fontWeight: '600', color: colors.white },
  failureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  failureBadgeText: { fontSize: 11, fontWeight: '600', color: colors.negative },
  blendCheckboxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  blendNameInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
