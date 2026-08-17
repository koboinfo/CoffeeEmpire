import type { StateCreator } from 'zustand';
import {
  applyEffect,
  calculateDepartmentUpgradeCost,
  canEstablishHolding,
  canIncorporate,
  establishHolding,
  incorporateCompany,
  upgradeDepartment,
  upgradeHeadquarters,
  type DepartmentType,
  type Employee,
  type ExecutiveAutomation,
  type HeadquartersOffice,
  type MarketingCampaignPreset,
} from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

const HEADQUARTERS_ESTABLISHMENT_COST = 800_000;
const HEADQUARTERS_UPGRADE_COST_PER_TIER = 800_000;

export interface CorporateSlice {
  establishHeadquarters: (cityId: string) => void;
  upgradeHeadquartersAction: () => void;
  upgradeDepartmentAction: (department: DepartmentType) => void;
  hireExecutive: (candidate: Employee) => void;
  launchCampaign: (preset: MarketingCampaignPreset) => void;
  setExecutiveAutomation: (settings: Partial<ExecutiveAutomation>) => void;
  incorporate: () => void;
  establishHoldingAction: (distinctCityCount: number) => void;
}

export const createCorporateSlice: StateCreator<GameStore, [], [], CorporateSlice> = (set, get) => ({
  establishHeadquarters: (cityId) => {
    const { state } = get();
    if (state.headquarters || state.cash < HEADQUARTERS_ESTABLISHMENT_COST) return;

    const headquarters: HeadquartersOffice = {
      id: `hq-${cityId}`,
      cityId,
      sizeTier: 1,
      rentPerMonth: 150_000,
      departments: {},
    };

    set({ state: { ...state, headquarters, cash: state.cash - HEADQUARTERS_ESTABLISHMENT_COST } });
  },

  upgradeHeadquartersAction: () => {
    const { state } = get();
    if (!state.headquarters) return;
    const upgradeCost = state.headquarters.sizeTier * HEADQUARTERS_UPGRADE_COST_PER_TIER;
    if (state.cash < upgradeCost) return;

    set({
      state: { ...state, headquarters: upgradeHeadquarters(state.headquarters), cash: state.cash - upgradeCost },
    });
  },

  upgradeDepartmentAction: (department) => {
    const { state } = get();
    if (!state.headquarters) return;
    const currentLevel = state.headquarters.departments[department]?.level ?? 0;
    const cost = calculateDepartmentUpgradeCost(currentLevel);
    if (state.cash < cost) return;

    set({
      state: {
        ...state,
        headquarters: upgradeDepartment(state.headquarters, department),
        cash: state.cash - cost,
      },
    });
  },

  hireExecutive: (candidate) => {
    const { state } = get();
    set({ state: { ...state, employees: [...state.employees, candidate] } });
  },

  launchCampaign: (preset) => {
    const { state } = get();
    const campaign = {
      id: `campaign-${preset.type}-${state.turn}`,
      type: preset.type,
      budget: preset.budget,
      durationTurns: preset.durationTurns,
      awarenessEffect: preset.awarenessEffect,
      startedAtTurn: state.turn,
    };

    const { statuses } = applyEffect(state, { brandAwareness: preset.awarenessEffect });

    set({
      state: {
        ...state,
        statuses,
        activeCampaigns: [...state.activeCampaigns, campaign],
      },
    });
  },

  setExecutiveAutomation: (settings) => {
    const { state } = get();
    set({ state: { ...state, executiveAutomation: { ...state.executiveAutomation, ...settings } } });
  },

  incorporate: () => {
    const { state } = get();
    if (!canIncorporate(state)) return;
    set({ state: incorporateCompany(state) });
  },

  establishHoldingAction: (distinctCityCount) => {
    const { state } = get();
    if (!canEstablishHolding(state, distinctCityCount)) return;
    set({ state: establishHolding(state, distinctCityCount) });
  },
});
