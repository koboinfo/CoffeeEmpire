import type { StateCreator } from 'zustand';
import { canUnlockResearchNode, researchTree } from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

export interface ResearchSlice {
  unlockResearchNode: (nodeId: string) => void;
}

export const createResearchSlice: StateCreator<GameStore, [], [], ResearchSlice> = (set, get) => ({
  unlockResearchNode: (nodeId) => {
    const { state } = get();
    const node = researchTree.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    if (!canUnlockResearchNode(node, state.researchUnlockedIds)) return;
    if (state.cash < node.cost) return;

    set({
      state: {
        ...state,
        cash: state.cash - node.cost,
        researchUnlockedIds: [...state.researchUnlockedIds, node.id],
      },
    });
  },
});
