import type { StoreEventDefinition } from '../types/storeEvents.js';

/**
 * 店舗ごとイベントテーブル。各店舗に対して毎ターン独立に判定する(data/events.tsの全社イベントとは別枠)。
 * rent-hike-notice/viral-buzz/food-safety-rumorは店舗単位の出来事を表現するための新規イベント。
 */
export const storeEvents: StoreEventDefinition[] = [
  {
    id: 'equipment-breakdown',
    probability: 0.06,
    cashRange: [-220_000, -80_000],
  },
  {
    id: 'employee-strike',
    probability: 0.04,
    condition: (_store, avgEmployeeMotivation) => avgEmployeeMotivation < 40,
    cashRange: [-300_000, -100_000],
    motivationRange: [-20, -10],
  },
  {
    id: 'rent-hike-notice',
    probability: 0.03,
    cashRange: [-300_000, -100_000],
  },
  {
    id: 'viral-buzz',
    probability: 0.03,
    revenueMultiplierRange: [2, 3],
  },
  {
    id: 'food-safety-rumor',
    probability: 0.03,
    satisfactionRange: [-30, -15],
  },
];
