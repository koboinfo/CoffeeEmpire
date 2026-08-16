import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { TabBar, type TabBarItem } from '../components/TabBar';
import { OverviewTab } from './store-detail/OverviewTab';
import { OperationsTab } from './store-detail/OperationsTab';
import { DesignTab } from './store-detail/DesignTab';
import { StaffTab } from './store-detail/StaffTab';
import { colors, spacing, typography } from '../theme/theme';

type Route = RouteProp<RootStackParamList, 'StoreDetail'>;

type TabKey = 'overview' | 'operations' | 'design' | 'staff';

const TABS: TabBarItem<TabKey>[] = [
  { key: 'overview', label: '概要' },
  { key: 'operations', label: '運営' },
  { key: 'design', label: '内装・機材' },
  { key: 'staff', label: '人事' },
];

export function StoreDetailScreen() {
  const route = useRoute<Route>();
  const { storeId } = route.params;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const store = useGameStore((s) => s.state.stores.find((st) => st.id === storeId));
  const cash = useGameStore((s) => s.state.cash);
  const turn = useGameStore((s) => s.state.turn);
  const employees = useGameStore((s) => s.state.employees);
  const roastedInventory = useGameStore((s) => s.state.roastedInventory);
  const storeReports = useGameStore((s) => s.latestStoreReports);
  const setMenuItemPrice = useGameStore((s) => s.setMenuItemPrice);
  const purchaseEquipment = useGameStore((s) => s.purchaseEquipment);
  const sellEquipment = useGameStore((s) => s.sellEquipment);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const adjustSalary = useGameStore((s) => s.adjustSalary);
  const trainEmployee = useGameStore((s) => s.trainEmployee);
  const setOperatingHours = useGameStore((s) => s.setOperatingHours);
  const applyRoastedBatchToMenuItem = useGameStore((s) => s.applyRoastedBatchToMenuItem);

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

      <TabBar items={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' ? (
        <OverviewTab store={store} storeReport={storeReports[store.id]} storeEmployees={storeEmployees} />
      ) : null}
      {activeTab === 'operations' ? (
        <OperationsTab
          store={store}
          roastedInventory={roastedInventory}
          setMenuItemPrice={setMenuItemPrice}
          applyRoastedBatchToMenuItem={applyRoastedBatchToMenuItem}
          setOperatingHours={setOperatingHours}
        />
      ) : null}
      {activeTab === 'design' ? (
        <DesignTab store={store} cash={cash} purchaseEquipment={purchaseEquipment} sellEquipment={sellEquipment} />
      ) : null}
      {activeTab === 'staff' ? (
        <StaffTab
          store={store}
          storeEmployees={storeEmployees}
          turn={turn}
          cash={cash}
          hireEmployee={hireEmployee}
          fireEmployee={fireEmployee}
          adjustSalary={adjustSalary}
          trainEmployee={trainEmployee}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  storeTitle: { ...typography.title, color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
});
