import type { StateCreator } from 'zustand';
import { menuCatalog } from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

export interface MenuSlice {
  unlockMenuItem: (templateId: string) => void;
  addMenuItemToStore: (storeId: string, templateId: string) => void;
}

// unlockResearchNode(researchSlice.ts)と同じ「会社全体で一度支払えばunlockedIdsに積む」パターン。
export const createMenuSlice: StateCreator<GameStore, [], [], MenuSlice> = (set, get) => ({
  unlockMenuItem: (templateId) => {
    const { state } = get();
    const template = menuCatalog.find((candidate) => candidate.templateId === templateId);
    if (!template) return;
    const unlockedMenuItemIds = state.unlockedMenuItemIds ?? [];
    if (unlockedMenuItemIds.includes(templateId)) return;
    if (state.cash < template.unlockCost) return;

    set({
      state: {
        ...state,
        cash: state.cash - template.unlockCost,
        unlockedMenuItemIds: [...unlockedMenuItemIds, templateId],
      },
    });
  },

  // アンロック済みテンプレートを指定店舗のメニューに追加する(追加自体は無料。開発費はunlockMenuItemで既に支払い済み)。
  addMenuItemToStore: (storeId, templateId) => {
    const { state } = get();
    const template = menuCatalog.find((candidate) => candidate.templateId === templateId);
    if (!template) return;
    if (!(state.unlockedMenuItemIds ?? []).includes(templateId)) return;

    const stores = state.stores.map((store) => {
      if (store.id !== storeId) return store;
      if (store.menu.some((item) => item.id.startsWith(`${templateId}-`))) return store; // 同一店舗への重複追加を防ぐ
      return {
        ...store,
        menu: [
          ...store.menu,
          {
            id: `${templateId}-${storeId}-${state.turn}`,
            name: template.name,
            category: template.category,
            basePrice: template.basePrice,
            currentPrice: template.basePrice,
            costOfGoods: template.costOfGoods,
            qualityScore: template.qualityScore,
          },
        ],
      };
    });

    set({ state: { ...state, stores } });
  },
});
