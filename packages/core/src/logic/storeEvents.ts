import type { Store } from '../types/store.js';
import type { StoreEventDefinition, TriggeredStoreEvent } from '../types/storeEvents.js';

function randomInRange([min, max]: [number, number], rng: () => number): number {
  return min + rng() * (max - min);
}

/**
 * 1店舗に対して店舗ごとイベントを判定する。定義ごとに独立してrng()を1回消費するため、
 * 店舗数が多いほど呼び出し回数(=発生機会)も増える。
 */
export function rollStoreEvents(
  definitions: StoreEventDefinition[],
  store: Store,
  avgEmployeeMotivation: number,
  rng: () => number = Math.random
): TriggeredStoreEvent[] {
  const triggered: TriggeredStoreEvent[] = [];

  for (const definition of definitions) {
    if (definition.condition && !definition.condition(store, avgEmployeeMotivation)) continue;
    if (rng() >= definition.probability) continue;

    triggered.push({
      storeId: store.id,
      eventId: definition.id,
      cashAmount: definition.cashRange ? Math.round(randomInRange(definition.cashRange, rng)) : 0,
      satisfactionDelta: definition.satisfactionRange ? Math.round(randomInRange(definition.satisfactionRange, rng)) : 0,
      motivationDelta: definition.motivationRange ? Math.round(randomInRange(definition.motivationRange, rng)) : 0,
      revenueMultiplier: definition.revenueMultiplierRange
        ? randomInRange(definition.revenueMultiplierRange, rng)
        : 1,
    });
  }

  return triggered;
}
