import type { StateCreator } from 'zustand';
import {
  applyEffect,
  bumpCityBrandAwareness,
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
  launchCampaign: (preset: MarketingCampaignPreset, cityId?: string) => void;
  setExecutiveAutomation: (settings: Partial<ExecutiveAutomation>) => void;
  incorporate: () => void;
  establishHoldingAction: (distinctCityCount: number) => void;
  /** ストックオプション/RSU相当の株式報酬を役員に付与する(月額、0で解除)。Phase A追加。 */
  setEmployeeEquityCompensation: (employeeId: string, amountPerMonth: number) => void;
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

  // cityId指定時は都市限定キャンペーンとして扱い、グローバルなstatuses.brandAwarenessではなく
  // その都市のbrandAwarenessByCityのみへ即時加点する(以後はturnEngineが期間中、毎ターン按分して積み増す)。
  // cityId未指定時は従来通りグローバルへ即時加点する(後方互換)。
  launchCampaign: (preset, cityId) => {
    const { state } = get();
    const campaign = {
      id: `campaign-${preset.type}-${state.turn}`,
      type: preset.type,
      budget: preset.budget,
      durationTurns: preset.durationTurns,
      awarenessEffect: preset.awarenessEffect,
      startedAtTurn: state.turn,
      ...(cityId ? { cityId } : {}),
      ...(preset.entryRateBonus !== undefined ? { entryRateBonus: preset.entryRateBonus } : {}),
      ...(preset.repeatRateBonus !== undefined ? { repeatRateBonus: preset.repeatRateBonus } : {}),
    };

    if (cityId) {
      set({
        state: {
          ...state,
          brandAwarenessByCity: bumpCityBrandAwareness(state.brandAwarenessByCity, cityId, preset.awarenessEffect),
          activeCampaigns: [...state.activeCampaigns, campaign],
        },
      });
      return;
    }

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

  setEmployeeEquityCompensation: (employeeId, amountPerMonth) => {
    const { state } = get();
    const employees = state.employees.map((employee) =>
      employee.id === employeeId ? { ...employee, equityCompensationPerMonth: Math.max(0, amountPerMonth) } : employee
    );
    set({ state: { ...state, employees } });
  },
});
