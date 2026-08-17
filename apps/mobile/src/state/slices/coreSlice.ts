import type { StateCreator } from 'zustand';
import {
  advanceTurn,
  capHistory,
  cities,
  events,
  farms,
  marketingCampaignPresets,
  researchTree,
  storeEvents,
  type BalanceSheet,
  type CashFlowStatement,
  type CoffeeEmpireState,
  type IncomeStatement,
  type Property,
  type SettlementResult,
  type SimEvent,
  type StoreReport,
  type TriggeredStoreEvent,
  type TurnContext,
} from '@coffee-empire/core';
import { createInitialState, sampleProperties } from '../../data/sampleWorld';
import { clearState, loadState, saveState } from '../persistence';
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
  latestStoreReports: Record<string, StoreReport>;
  latestTriggeredEvents: SimEvent[];
  latestTriggeredStoreEvents: TriggeredStoreEvent[];
  latestSettlement: SettlementResult | null;
  isHydrated: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  advance: () => Promise<void>;
  dismissError: () => void;
  dismissTriggeredEvents: () => void;
  dismissSettlement: () => void;
  resetGame: () => Promise<void>;
}

export const createCoreSlice: StateCreator<GameStore, [], [], CoreSlice> = (set, get) => ({
  state: createInitialState(),
  properties: sampleProperties,
  pendingCapitalInjection: 0,
  latestIncomeStatement: null,
  latestBalanceSheet: null,
  latestCashFlowStatement: null,
  latestStoreReports: {},
  latestTriggeredEvents: [],
  latestTriggeredStoreEvents: [],
  latestSettlement: null,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    const saved = await loadState();
    set({ state: saved ?? createInitialState(), isHydrated: true });
  },

  advance: async () => {
    try {
      const { state, properties, pendingCapitalInjection } = get();
      if (state.isBankrupt) return;
      const turnContext = buildTurnContext(properties);
      const {
        nextState,
        incomeStatement,
        balanceSheet,
        cashFlowStatement,
        storeReports,
        triggeredEvents,
        triggeredStoreEvents,
        settlement,
      } = advanceTurn(
        state,
        turnContext,
        events,
        Math.random,
        pendingCapitalInjection,
        marketingCampaignPresets,
        researchTree,
        storeEvents
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
          stockPrices: nextState.stock.isPublic
            ? capHistory(
                [...nextState.history.stockPrices, { turn: nextState.turn, sharePrice: nextState.stock.sharePrice }],
                MAX_HISTORY_TURNS
              )
            : nextState.history.stockPrices,
          newsFeed: capHistory(
            [
              ...nextState.history.newsFeed,
              ...triggeredEvents.map((event) => ({ turn: nextState.turn, eventId: event.id })),
              ...triggeredStoreEvents.map((event) => ({
                turn: nextState.turn,
                eventId: event.eventId,
                storeId: event.storeId,
              })),
            ],
            MAX_HISTORY_TURNS
          ),
          settlements: settlement
            ? capHistory([...nextState.history.settlements, settlement], MAX_HISTORY_TURNS)
            : nextState.history.settlements,
        },
      };
      set({
        state: updatedState,
        pendingCapitalInjection: 0,
        latestIncomeStatement: incomeStatement,
        latestBalanceSheet: balanceSheet,
        latestCashFlowStatement: cashFlowStatement,
        latestStoreReports: storeReports,
        latestTriggeredEvents: triggeredEvents,
        latestTriggeredStoreEvents: triggeredStoreEvents,
        latestSettlement: settlement ?? null,
        error: null,
      });
      await saveState(updatedState);
    } catch (error) {
      console.warn('[gameStore] advance failed', error);
      set({ error: 'ターンの進行中にエラーが発生しました。もう一度お試しください。' });
    }
  },

  dismissError: () => set({ error: null }),

  dismissTriggeredEvents: () => set({ latestTriggeredEvents: [], latestTriggeredStoreEvents: [] }),

  dismissSettlement: () => set({ latestSettlement: null }),

  /** 黒字倒産(isBankrupt)後、新しい会社としてゲームを再スタートするための保存データ破棄+初期化。 */
  resetGame: async () => {
    await clearState();
    set({
      state: createInitialState(),
      pendingCapitalInjection: 0,
      latestIncomeStatement: null,
      latestBalanceSheet: null,
      latestCashFlowStatement: null,
      latestStoreReports: {},
      latestTriggeredEvents: [],
      latestTriggeredStoreEvents: [],
      latestSettlement: null,
      error: null,
    });
  },
});
