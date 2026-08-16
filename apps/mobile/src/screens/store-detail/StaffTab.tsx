import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateEmployeeCandidates, type Employee, type EmployeeRole, type Store } from '@coffee-empire/core';
import { Card } from '../../components/Card';
import { trainingCost } from '../../state/slices/storeSlice';
import { colors, spacing, radius, typography } from '../../theme/theme';

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

const SALARY_STEP = 5000;

interface StaffTabProps {
  store: Store;
  storeEmployees: Employee[];
  turn: number;
  cash: number;
  hireEmployee: (storeId: string, candidate: Employee) => void;
  fireEmployee: (storeId: string, employeeId: string) => void;
  adjustSalary: (employeeId: string, salary: number) => void;
  trainEmployee: (employeeId: string) => void;
}

export function StaffTab({
  store,
  storeEmployees,
  turn,
  cash,
  hireEmployee,
  fireEmployee,
  adjustSalary,
  trainEmployee,
}: StaffTabProps) {
  const [candidateRole, setCandidateRole] = useState<EmployeeRole | null>(null);
  const candidates = useMemo(
    () => (candidateRole ? generateEmployeeCandidates(candidateRole, 3, turn) : []),
    [candidateRole, turn]
  );

  return (
    <View style={styles.container}>
      <Card>
        <SectionLabel icon="people" label={`従業員(${storeEmployees.length}名)`} />
        {storeEmployees.map((employee) => {
          const cost = trainingCost(employee.skillLevel);
          const canTrain = employee.skillLevel < 100 && cash >= cost;
          return (
            <View key={employee.id} style={styles.employeeBlock}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {employee.name}({employee.role}) スキル{employee.skillLevel}
                </Text>
                <Pressable onPress={() => fireEmployee(store.id, employee.id)}>
                  <Text style={styles.fireText}>解雇</Text>
                </Pressable>
              </View>
              <View style={styles.row}>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => adjustSalary(employee.id, employee.salaryPerMonth - SALARY_STEP)}
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.rowValue}>{formatCurrency(employee.salaryPerMonth)}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => adjustSalary(employee.id, employee.salaryPerMonth + SALARY_STEP)}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
                <Pressable
                  style={[styles.trainButton, !canTrain && styles.trainButtonDisabled]}
                  disabled={!canTrain}
                  onPress={() => trainEmployee(employee.id)}
                >
                  <Text style={styles.trainButtonText}>研修({formatCurrency(cost)})</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  cardLabel: { ...typography.label, color: colors.textSecondary },
  employeeBlock: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 14, color: colors.textPrimary, flexShrink: 1 },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  fireText: { fontSize: 12, fontWeight: '600', color: colors.negative },
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
  trainButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  trainButtonDisabled: { opacity: 0.4 },
  trainButtonText: { fontSize: 12, fontWeight: '600', color: colors.roastLight },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roleButtonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  roleButton: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  roleButtonText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
});
