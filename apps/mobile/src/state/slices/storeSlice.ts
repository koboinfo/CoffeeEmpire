import type { StateCreator } from 'zustand';
import type { Employee, Equipment, EquipmentTemplate, Property, Store } from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

const MIN_SALARY_RATIO = 0.5;
const MAX_SALARY_RATIO = 2;
const TRAINING_SKILL_GAIN = 10;

export function trainingCost(skillLevel: number): number {
  return Math.round(5000 + skillLevel * 500);
}

export interface StoreSlice {
  openStore: (property: Property, storeName: string) => void;
  setMenuItemPrice: (storeId: string, menuItemId: string, price: number) => void;
  purchaseEquipment: (storeId: string, template: EquipmentTemplate) => void;
  sellEquipment: (storeId: string, equipmentId: string) => void;
  hireEmployee: (storeId: string, candidate: Employee) => void;
  fireEmployee: (storeId: string, employeeId: string) => void;
  adjustSalary: (employeeId: string, salary: number) => void;
  trainEmployee: (employeeId: string) => void;
  setOperatingHours: (storeId: string, open: number, close: number) => void;
}

export const createStoreSlice: StateCreator<GameStore, [], [], StoreSlice> = (set, get) => ({
  openStore: (property, storeName) => {
    const { state, properties } = get();
    const ownedProperty: Property = { ...property, ownership: 'leased' };
    const newStore: Store = {
      id: `store-${property.id}-${state.turn}`,
      propertyId: property.id,
      name: storeName,
      equipment: [],
      menu: [
        {
          id: `menu-espresso-${property.id}`,
          name: 'Espresso',
          category: 'coffee',
          basePrice: 400,
          currentPrice: 400,
          costOfGoods: 100,
          qualityScore: 60,
        },
      ],
      employeeIds: [],
      openedAtTurn: state.turn,
      cumulativeCustomerSatisfaction: 50,
      operatingHours: { open: 7, close: 21 },
    };

    set({
      properties: [...properties.filter((p) => p.id !== property.id), ownedProperty],
      state: { ...state, stores: [...state.stores, newStore] },
    });
  },

  setMenuItemPrice: (storeId, menuItemId, price) => {
    const { state } = get();
    const stores = state.stores.map((store) => {
      if (store.id !== storeId) return store;
      return {
        ...store,
        menu: store.menu.map((item) => (item.id === menuItemId ? { ...item, currentPrice: price } : item)),
      };
    });
    set({ state: { ...state, stores } });
  },

  purchaseEquipment: (storeId, template) => {
    const { state } = get();
    if (state.cash < template.purchaseCost) return; // 資金不足。UI側でも事前にボタンを無効化する

    const equipment: Equipment = {
      id: `eq-${template.templateId}-${storeId}-${state.turn}-${Math.floor(Math.random() * 10000)}`,
      category: template.category,
      tier: template.tier,
      purchaseCost: template.purchaseCost,
      maintenanceCostPerMonth: template.maintenanceCostPerMonth,
      depreciationMonths: template.depreciationMonths,
      purchasedAtTurn: state.turn,
    };

    const stores = state.stores.map((store) =>
      store.id === storeId ? { ...store, equipment: [...store.equipment, equipment] } : store
    );

    // 購入額は即時cashから差し引く。advanceTurnのinvestingCashFlowにはまだ反映されない(既知の簡略化)。
    set({ state: { ...state, stores, cash: state.cash - template.purchaseCost } });
  },

  hireEmployee: (storeId, candidate) => {
    const { state } = get();
    const employee: Employee = { ...candidate, assignedStoreId: storeId };

    const stores = state.stores.map((store) =>
      store.id === storeId
        ? {
            ...store,
            employeeIds: [...store.employeeIds, employee.id],
            managerId: employee.role === 'storeManager' ? employee.id : store.managerId,
          }
        : store
    );

    set({ state: { ...state, employees: [...state.employees, employee], stores } });
  },

  sellEquipment: (storeId, equipmentId) => {
    const { state } = get();
    const store = state.stores.find((s) => s.id === storeId);
    const equipment = store?.equipment.find((eq) => eq.id === equipmentId);
    if (!store || !equipment) return;

    // 下取り額は購入額の半額(既知の簡略化。減価償却状況は考慮しない)。
    const refund = Math.round(equipment.purchaseCost * 0.5);
    const stores = state.stores.map((s) =>
      s.id === storeId ? { ...s, equipment: s.equipment.filter((eq) => eq.id !== equipmentId) } : s
    );

    set({ state: { ...state, stores, cash: state.cash + refund } });
  },

  fireEmployee: (storeId, employeeId) => {
    const { state } = get();
    const stores = state.stores.map((store) =>
      store.id === storeId
        ? {
            ...store,
            employeeIds: store.employeeIds.filter((id) => id !== employeeId),
            managerId: store.managerId === employeeId ? undefined : store.managerId,
          }
        : store
    );
    const employees = state.employees.filter((employee) => employee.id !== employeeId);

    set({ state: { ...state, stores, employees } });
  },

  adjustSalary: (employeeId, salary) => {
    const { state } = get();
    const employees = state.employees.map((employee) => {
      if (employee.id !== employeeId) return employee;
      // baseline(採用時給与)を大きく外れたスライダー操作を防ぐため、初期給与の0.5〜2倍に丸める。
      const min = Math.round(employee.salaryPerMonth * MIN_SALARY_RATIO);
      const max = Math.round(employee.salaryPerMonth * MAX_SALARY_RATIO);
      return { ...employee, salaryPerMonth: Math.min(max, Math.max(min, salary)) };
    });
    set({ state: { ...state, employees } });
  },

  trainEmployee: (employeeId) => {
    const { state } = get();
    const employee = state.employees.find((e) => e.id === employeeId);
    if (!employee) return;
    const cost = trainingCost(employee.skillLevel);
    if (state.cash < cost) return;

    const employees = state.employees.map((e) =>
      e.id === employeeId ? { ...e, skillLevel: Math.min(100, e.skillLevel + TRAINING_SKILL_GAIN) } : e
    );

    set({ state: { ...state, employees, cash: state.cash - cost } });
  },

  setOperatingHours: (storeId, open, close) => {
    const { state } = get();
    const stores = state.stores.map((store) =>
      store.id === storeId ? { ...store, operatingHours: { open, close } } : store
    );
    set({ state: { ...state, stores } });
  },
});
