import type { SimEvent } from '../types/simState.js';

/**
 * Phase 4初期イベントテーブル。probabilityは1ターン(月次)あたりの発生確率。
 * conditionはSimState.statuses/cashを参照する(基盤④README準拠)。
 */
export const events: SimEvent[] = [
  {
    id: 'viral-social-moment',
    probability: 0.08,
    effect: { brandAwareness: 15 },
  },
  {
    id: 'weather-crop-failure',
    probability: 0.05,
    effect: { cash: -20000 },
  },
  {
    id: 'employee-strike',
    probability: 0.04,
    condition: (state) => (state.statuses.employeeMorale?.value ?? 100) < 40,
    effect: { cash: -10000, employeeMorale: -10 },
  },
  {
    id: 'equipment-breakdown',
    probability: 0.06,
    effect: { cash: -5000 },
  },
  {
    id: 'competitor-price-war',
    probability: 0.05,
    effect: { brandAwareness: -5 },
  },
  {
    id: 'economic-boom',
    probability: 0.05,
    effect: { cash: 15000, brandAwareness: 5 },
  },
  {
    id: 'economic-recession',
    probability: 0.05,
    effect: { cash: -15000 },
  },
  {
    id: 'quality-scandal',
    probability: 0.03,
    condition: (state) => (state.statuses.avgQuality?.value ?? 100) < 50,
    effect: { brandAwareness: -20 },
  },
  {
    id: 'celebrity-endorsement',
    probability: 0.03,
    condition: (state) => state.cash > 100000,
    effect: { brandAwareness: 25, cash: -10000 },
  },
  {
    id: 'loyalty-program-success',
    probability: 0.07,
    condition: (state) => (state.statuses.employeeMorale?.value ?? 0) > 70,
    effect: { brandAwareness: 8, cash: 3000 },
  },
];
