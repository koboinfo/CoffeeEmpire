import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { TabBar, type TabBarItem } from '../components/TabBar';
import { GridBackdrop } from '../components/GridBackdrop';
import { getCityImage } from '../assets/images/registry';
import { OverviewTab } from './store-detail/OverviewTab';
import { OperationsTab } from './store-detail/OperationsTab';
import { DesignTab } from './store-detail/DesignTab';
import { StaffTab } from './store-detail/StaffTab';

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
  const properties = useGameStore((s) => s.properties);
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
  const unlockedMenuItemIds = useGameStore((s) => s.state.unlockedMenuItemIds);
  const addMenuItemToStore = useGameStore((s) => s.addMenuItemToStore);

  if (!store) {
    return (
      <View className="flex-1 bg-background">
        <Text className="mt-lg text-center text-[13px] text-text-muted">店舗が見つかりません</Text>
      </View>
    );
  }

  const storeEmployees = employees.filter((employee) => store.employeeIds.includes(employee.id));
  const property = properties.find((p) => p.id === store.propertyId);
  const cityImage = property ? getCityImage(property.cityId) : undefined;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-md pb-xl">
      <GridBackdrop image={cityImage} className="justify-end p-md" style={{ height: 96 }}>
        <Text className="text-xl font-bold text-text-primary" style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 }}>
          {store.name}
        </Text>
      </GridBackdrop>

      <View className="gap-md px-md">
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
          unlockedMenuItemIds={unlockedMenuItemIds ?? []}
          addMenuItemToStore={addMenuItemToStore}
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
      </View>
    </ScrollView>
  );
}
