import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { generateEmployeeCandidates, type Employee, type EmployeeRole, type Store } from '@coffee-empire/core';
import { Gauge } from '../../components/Gauge';
import { trainingCost } from '../../state/slices/storeSlice';
import { StaffIcon } from '../../icons';
import { colors } from '../../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View className="mb-xs flex-row items-center gap-xs">
      <StaffIcon size={15} color={colors.roastLight} />
      <Text className="text-[13px] font-medium text-text-secondary">{label}</Text>
    </View>
  );
}

function Stepper({ value, onDecrement, onIncrement }: { value: string; onDecrement: () => void; onIncrement: () => void }) {
  return (
    <View className="flex-row items-center gap-sm">
      <Pressable
        className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        onPress={onDecrement}
      >
        <Text className="text-base font-bold text-text-primary">-</Text>
      </Pressable>
      <Text className="min-w-[80px] text-center text-sm font-bold text-text-primary">{value}</Text>
      <Pressable
        className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        onPress={onIncrement}
      >
        <Text className="text-base font-bold text-text-primary">+</Text>
      </Pressable>
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
    <View className="gap-md">
      <View className="gap-sm rounded-md border border-border bg-surface p-md">
        <SectionLabel label={`従業員(${storeEmployees.length}名)`} />
        {storeEmployees.map((employee, index) => {
          const cost = trainingCost(employee.skillLevel);
          const canTrain = employee.skillLevel < 100 && cash >= cost;
          const moraleColor = employee.motivation >= 60 ? colors.positive : employee.motivation >= 35 ? colors.gold : colors.negative;

          return (
            <View
              key={employee.id}
              className={`gap-sm py-sm ${index === 0 ? '' : 'border-t border-border'}`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-shrink text-sm text-text-primary">
                  {employee.name}({employee.role}) スキル{employee.skillLevel}
                </Text>
                <Pressable onPress={() => fireEmployee(store.id, employee.id)}>
                  <Text className="text-xs font-semibold text-negative">解雇</Text>
                </Pressable>
              </View>

              <Gauge label="モチベーション" value={employee.motivation} color={moraleColor} />

              <View className="flex-row items-center justify-between">
                <Stepper
                  value={formatCurrency(employee.salaryPerMonth)}
                  onDecrement={() => adjustSalary(employee.id, employee.salaryPerMonth - SALARY_STEP)}
                  onIncrement={() => adjustSalary(employee.id, employee.salaryPerMonth + SALARY_STEP)}
                />
                <Pressable
                  className={`rounded-sm bg-surface-alt px-sm py-xs ${canTrain ? '' : 'opacity-40'}`}
                  disabled={!canTrain}
                  onPress={() => trainEmployee(employee.id)}
                >
                  <Text className="text-xs font-semibold text-roast-light">研修({formatCurrency(cost)})</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <View className="mt-sm flex-row gap-sm">
          <Pressable className="flex-1 items-center rounded-sm bg-surface-alt p-sm" onPress={() => setCandidateRole('barista')}>
            <Text className="text-xs font-semibold text-text-primary">バリスタ採用候補</Text>
          </Pressable>
          <Pressable className="flex-1 items-center rounded-sm bg-surface-alt p-sm" onPress={() => setCandidateRole('storeManager')}>
            <Text className="text-xs font-semibold text-text-primary">店長採用候補</Text>
          </Pressable>
        </View>

        {candidates.map((candidate) => (
          <Pressable
            key={candidate.id}
            className="flex-row items-center justify-between border-t border-border py-sm"
            onPress={() => {
              hireEmployee(store.id, candidate);
              setCandidateRole(null);
            }}
          >
            <Text className="text-sm text-text-primary">{candidate.name}</Text>
            <Text className="text-sm font-semibold text-text-primary">
              スキル{candidate.skillLevel} / {formatCurrency(candidate.salaryPerMonth)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
