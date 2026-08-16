import type { StateCreator } from 'zustand';
import type { Employee, Equipment, EquipmentTemplate, Property, Store } from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

export interface StoreSlice {
  openStore: (property: Property, storeName: string) => void;
  setMenuItemPrice: (storeId: string, menuItemId: string, price: number) => void;
  purchaseEquipment: (storeId: string, template: EquipmentTemplate) => void;
  hireEmployee: (storeId: string, candidate: Employee) => void;
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
});
