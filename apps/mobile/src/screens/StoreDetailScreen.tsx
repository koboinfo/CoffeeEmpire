import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { equipmentCatalog, generateEmployeeCandidates, type EmployeeRole } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Card } from '../components/Card';
import { colors, spacing, radius, typography } from '../theme/theme';

type Route = RouteProp<RootStackParamList, 'StoreDetail'>;

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

export function StoreDetailScreen() {
  const route = useRoute<Route>();
  const { storeId } = route.params;

  const store = useGameStore((s) => s.state.stores.find((st) => st.id === storeId));
  const cash = useGameStore((s) => s.state.cash);
  const employees = useGameStore((s) => s.state.employees);
  const turn = useGameStore((s) => s.state.turn);
  const roastedInventory = useGameStore((s) => s.state.roastedInventory);
  const setMenuItemPrice = useGameStore((s) => s.setMenuItemPrice);
  const purchaseEquipment = useGameStore((s) => s.purchaseEquipment);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const applyRoastedBatchToMenuItem = useGameStore((s) => s.applyRoastedBatchToMenuItem);

  const [candidateRole, setCandidateRole] = useState<EmployeeRole | null>(null);
  const [pickingBatchForMenuItemId, setPickingBatchForMenuItemId] = useState<string | null>(null);
  const candidates = useMemo(
    () => (candidateRole ? generateEmployeeCandidates(candidateRole, 3, turn) : []),
    [candidateRole, turn]
  );

  if (!store) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>店舗が見つかりません</Text>
      </View>
    );
  }

  const storeEmployees = employees.filter((employee) => store.employeeIds.includes(employee.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.storeTitle}>{store.name}</Text>

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

      <Card>
        <SectionLabel icon="construct" label={`設備(${store.equipment.length}件)`} />
        {store.equipment.map((equipment) => (
          <Text key={equipment.id} style={styles.rowLabel}>
            {equipment.category}(tier {equipment.tier})
          </Text>
        ))}
        <Text style={styles.subLabel}>設備を追加</Text>
        {equipmentCatalog.map((template) => {
          const affordable = cash >= template.purchaseCost;
          return (
            <Pressable
              key={template.templateId}
              style={[styles.catalogRow, !affordable && styles.catalogRowDisabled]}
              disabled={!affordable}
              onPress={() => purchaseEquipment(store.id, template)}
            >
              <Text style={styles.rowLabel}>{template.name}</Text>
              <Text style={styles.rowValue}>{formatCurrency(template.purchaseCost)}</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <SectionLabel icon="people" label={`従業員(${storeEmployees.length}名)`} />
        {storeEmployees.map((employee) => (
          <Text key={employee.id} style={styles.rowLabel}>
            {employee.name}({employee.role}) スキル{employee.skillLevel} / 給与{formatCurrency(employee.salaryPerMonth)}
          </Text>
        ))}

        <View style={styles.roleButtonRow}>
          <Pressable style={styles.roleButton} onPress={() => setCandidateRole('barista')}>
            <Text style={styles.roleButtonText}>バリスタ採用候補</Text>
          </Pressable>
          <Pressable style={styles.roleButton} onPress={() => setCandidateRole('storeManager')}>
            <Text style={styles.roleButtonText}>店長採用候補</Text>
          </Pressable>
        </View>

        {candidates.map((candidate) => (
          <Pressable
            key={candidate.id}
            style={styles.catalogRow}
            onPress={() => {
              hireEmployee(store.id, candidate);
              setCandidateRole(null);
            }}
          >
            <Text style={styles.rowLabel}>{candidate.name}</Text>
            <Text style={styles.rowValue}>
              スキル{candidate.skillLevel} / {formatCurrency(candidate.salaryPerMonth)}
            </Text>
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  storeTitle: { ...typography.title, color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
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
  catalogRowDisabled: { opacity: 0.4 },
  linkButton: { paddingVertical: 4 },
  linkButtonText: { fontSize: 12, fontWeight: '600', color: colors.roast },
  roleButtonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  roleButton: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  roleButtonText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
});
