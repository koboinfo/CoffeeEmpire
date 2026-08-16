import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RoastBatch, Store } from '@coffee-empire/core';
import { Card } from '../../components/Card';
import { colors, spacing, radius, typography } from '../../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

const PRICE_STEP = 50;

function SectionLabel({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.roastLight} />
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

interface OperationsTabProps {
  store: Store;
  roastedInventory: RoastBatch[];
  setMenuItemPrice: (storeId: string, menuItemId: string, price: number) => void;
  applyRoastedBatchToMenuItem: (storeId: string, menuItemId: string, batchId: string) => void;
  setOperatingHours: (storeId: string, open: number, close: number) => void;
}

export function OperationsTab({
  store,
  roastedInventory,
  setMenuItemPrice,
  applyRoastedBatchToMenuItem,
  setOperatingHours,
}: OperationsTabProps) {
  const [pickingBatchForMenuItemId, setPickingBatchForMenuItemId] = useState<string | null>(null);
  const { open, close } = store.operatingHours;

  return (
    <View style={styles.container}>
      <Card>
        <SectionLabel icon="time" label="営業時間" />
        <View style={styles.hoursRow}>
          <View style={styles.hourStepper}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setOperatingHours(store.id, Math.max(0, open - 1), close)}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </Pressable>
            <Text style={styles.hourValue}>{open}:00</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setOperatingHours(store.id, Math.min(close - 1, open + 1), close)}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.hourSeparator}>〜</Text>
          <View style={styles.hourStepper}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setOperatingHours(store.id, open, Math.max(open + 1, close - 1))}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </Pressable>
            <Text style={styles.hourValue}>{close}:00</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setOperatingHours(store.id, open, Math.min(24, close + 1))}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card>
        <SectionLabel icon="restaurant" label="メニュー" />
        {store.menu.map((item) => {
          const isPicking = pickingBatchForMenuItemId === item.id;
          return (
            <View key={item.id}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => setMenuItemPrice(store.id, item.id, Math.max(0, item.currentPrice - PRICE_STEP))}
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.rowValue}>{formatCurrency(item.currentPrice)}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => setMenuItemPrice(store.id, item.id, item.currentPrice + PRICE_STEP)}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.subLabel}>
                原価 {formatCurrency(item.costOfGoods)} / 品質 {item.qualityScore}
              </Text>
              <Pressable
                style={styles.linkButton}
                onPress={() => setPickingBatchForMenuItemId(isPicking ? null : item.id)}
              >
                <Text style={styles.linkButtonText}>焙煎豆を適用</Text>
              </Pressable>
              {isPicking ? (
                roastedInventory.length === 0 ? (
                  <Text style={styles.subLabel}>適用可能な焙煎後在庫がありません</Text>
                ) : (
                  roastedInventory.map((batch) => (
                    <Pressable
                      key={batch.id}
                      style={styles.catalogRow}
                      onPress={() => {
                        applyRoastedBatchToMenuItem(store.id, item.id, batch.id);
                        setPickingBatchForMenuItemId(null);
                      }}
                    >
                      <Text style={styles.rowLabel}>
                        {batch.roastLevel} {batch.outputKg}kg
                      </Text>
                      <Text style={styles.rowValue}>品質{batch.qualityScore}</Text>
                    </Pressable>
                  ))
                )
              ) : null}
            </View>
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
  subLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 14, color: colors.textPrimary },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkButton: { paddingVertical: 4 },
  linkButtonText: { fontSize: 12, fontWeight: '600', color: colors.roast },
  hoursRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  hourStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hourValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, minWidth: 48, textAlign: 'center' },
  hourSeparator: { fontSize: 14, color: colors.textMuted },
});
