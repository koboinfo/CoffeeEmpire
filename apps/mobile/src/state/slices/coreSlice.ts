import type { StateCreator } from 'zustand';
import {
  advanceTurn,
  capHistory,
  cities,
  events,
  farms,
  marketingCampaignPresets,
  researchTree,
  type BalanceSheet,
  type CashFlowStatement,
  type CoffeeEmpireState,
  type IncomeStatement,
  type Property,
  type TurnContext,
} from '@coffee-empire/core';
import { createInitialState, sampleProperties } from '../../data/sampleWorld';
import { loadState, saveState } from '../persistence';
import type { GameStore } from '../gameStore';

const MAX_HISTORY_TURNS = 60;

function buildTurnContext(properties: Property[]): TurnContext {
  return {
    properties: Object.fromEntries(properties.map((property) => [property.id, property])),
    cities: Object.fromEntries(cities.map((city) => [city.id, city])),
    farms: Object.fromEntries(farms.map((farm) => [farm.id, farm])),
  };
}

export interface CoreSlice {
  state: CoffeeEmpireState;
  properties: Property[];
  pendingCapitalInjection: number;
  latestIncomeStatement: IncomeStatement | null;
  latestBalanceSheet: BalanceSheet | null;
  latestCashFlowStatement: CashFlowStatement | null;
  isHydrated: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  advance: () => Promise<void>;
  dismissError: () => void;
}

export const createCoreSlice: StateCreator<GameStore, [], [], CoreSlice> = (set, get) => ({
  state: createInitialState(),
  properties: sampleProperties,
  pendingCapitalInjection: 0,
  latestIncomeStatement: null,
  latestBalanceSheet: null,
  latestCashFlowStatement: null,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    const saved = await loadState();
    set({ state: saved ?? createInitialState(), isHydrated: true });
  },

  advance: async () => {
    try {
      const { state, properties, pendingCapitalInjection } = get();
      const turnContext = buildTurnContext(properties);
      const { nextState, incomeStatement, balanceSheet, cashFlowStatement } = advanceTurn(
        state,
        turnContext,
        events,
        Math.random,
        pendingCapitalInjection,
        marketingCampaignPresets,
        researchTree
      );
      const updatedState: CoffeeEmpireState = {
        ...nextState,
        history: {
          incomeStatements: capHistory([...nextState.history.incomeStatements, incomeStatement], MAX_HISTORY_TURNS),
          balanceSheets: capHistory([...nextState.history.balanceSheets, balanceSheet], MAX_HISTORY_TURNS),
          cashFlowStatements: capHistory(
            [...nextState.history.cashFlowStatements, cashFlowStatement],
            MAX_HISTORY_TURNS
          ),
        },
      };
      set({
        state: updatedState,
        pendingCapitalInjection: 0,
        latestIncomeStatement: incomeStatement,
        latestBalanceSheet: balanceSheet,
        latestCashFlowStatement: cashFlowStatement,
        error: null,
      });
      await saveState(updatedState);
    } catch (error) {
      console.warn('[gameStore] advance failed', error);
      set({ error: 'ターンの進行中にエラーが発生しました。もう一度お試しください。' });
    }
  },

  dismissError: () => set({ error: null }),
});
