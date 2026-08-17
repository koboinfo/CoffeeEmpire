import type { Store } from './store.js';

/**
 * 店舗ごとに独立して判定されるイベント(全社イベントとは別枠)。
 * 各店舗に対して毎ターン`probability`で判定するため、店舗数が多いほど発生機会も増える。
 */
export interface StoreEventDefinition {
  id: string;
  probability: number;
  condition?: (store: Store, avgEmployeeMotivation: number) => boolean;
  cashRange?: [number, number];
  satisfactionRange?: [number, number];
  motivationRange?: [number, number];
  revenueMultiplierRange?: [number, number];
}

export interface TriggeredStoreEvent {
  storeId: string;
  eventId: string;
  cashAmount: number;
  satisfactionDelta: number;
  motivationDelta: number;
  revenueMultiplier: number;
}
