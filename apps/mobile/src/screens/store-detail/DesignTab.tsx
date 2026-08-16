import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateInteriorQualityFactor, equipmentCatalog, type EquipmentTemplate, type Store } from '@coffee-empire/core';
import { Card } from '../../components/Card';
import { colors, spacing, typography } from '../../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

function SectionLabel({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.roastLight} />
      <Text style={styles.cardLabel}>{label}</Text>
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
    <View style={styles.container}>
      <Card>
        <SectionLabel icon="construct" label={`導入済み機材(${store.equipment.length}件)`} />
        {interiorFactor > 1 ? (
          <Text style={styles.bonusText}>座席・内装ボーナス: 売上 +{Math.round((interiorFactor - 1) * 100)}%</Text>
        ) : (
          <Text style={styles.subLabel}>座席・内装(furniture)機材を導入すると売上にボーナスが付きます</Text>
        )}
        {store.equipment.length === 0 ? <Text style={styles.subLabel}>まだ機材がありません</Text> : null}
        {store.equipment.map((equipment) => (
          <View key={equipment.id} style={styles.row}>
            <Text style={styles.rowLabel}>
              {equipment.category}(tier {equipment.tier})
            </Text>
            <Pressable onPress={() => sellEquipment(store.id, equipment.id)}>
              <Text style={styles.sellText}>売却</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <SectionLabel icon="storefront" label="機材カタログ(購入・入れ替え)" />
        {equipmentCatalog.map((template) => {
          const affordable = cash >= template.purchaseCost;
          return (
            <Pressable
              key={template.templateId}
              style={[styles.catalogRow, !affordable && styles.catalogRowDisabled]}
              disabled={!affordable}
              onPress={() => purchaseEquipment(store.id, template)}
            >
              <View>
                <Text style={styles.rowLabel}>{template.name}</Text>
                <Text style={styles.subLabel}>tier {template.tier}</Text>
              </View>
              <Text style={styles.rowValue}>{formatCurrency(template.purchaseCost)}</Text>
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  cardLabel: { ...typography.label, color: colors.textSecondary },
  subLabel: { fontSize: 12, color: colors.textMuted },
  bonusText: { fontSize: 12, fontWeight: '600', color: colors.positive },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  rowLabel: { fontSize: 14, color: colors.textPrimary },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sellText: { fontSize: 12, fontWeight: '600', color: colors.negative },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  catalogRowDisabled: { opacity: 0.4 },
});
