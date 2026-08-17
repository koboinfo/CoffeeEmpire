import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Store } from '../types/store.js';
import type { StoreEventDefinition } from '../types/storeEvents.js';
import { rollStoreEvents } from './storeEvents.js';

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    id: 'store-1',
    propertyId: 'prop-1',
    name: 'Downtown Store',
    equipment: [],
    menu: [],
    employeeIds: [],
    openedAtTurn: 0,
    cumulativeCustomerSatisfaction: 60,
    operatingHours: { open: 7, close: 21 },
    ...overrides,
  };
}

test('rollStoreEvents: rng()がprobability未満のイベントのみ発生する', () => {
  const definitions: StoreEventDefinition[] = [
    { id: 'always', probability: 1, cashRange: [-100, -100] },
    { id: 'never', probability: 0, cashRange: [100, 100] },
  ];
  const triggered = rollStoreEvents(definitions, makeStore(), 100, () => 0.5);
  assert.deepEqual(
    triggered.map((e) => e.eventId),
    ['always']
  );
});

test('rollStoreEvents: conditionを満たさないイベントは除外される', () => {
  const definitions: StoreEventDefinition[] = [
    { id: 'strike', probability: 1, condition: (_store, avgMotivation) => avgMotivation < 40, cashRange: [-100, -100] },
  ];
  const triggered = rollStoreEvents(definitions, makeStore(), 80, () => 0);
  assert.equal(triggered.length, 0);

  const triggeredWhenLowMorale = rollStoreEvents(definitions, makeStore(), 20, () => 0);
  assert.equal(triggeredWhenLowMorale.length, 1);
});

test('rollStoreEvents: cashRangeからランダムな金額を解決する', () => {
  const definitions: StoreEventDefinition[] = [{ id: 'breakdown', probability: 1, cashRange: [-200, -100] }];
  const triggered = rollStoreEvents(definitions, makeStore(), 100, () => 0.5);
  assert.equal(triggered[0].cashAmount, -150);
});

test('rollStoreEvents: storeIdが結果に含まれる', () => {
  const definitions: StoreEventDefinition[] = [{ id: 'breakdown', probability: 1, cashRange: [-100, -100] }];
  const triggered = rollStoreEvents(definitions, makeStore({ id: 'store-xyz' }), 100, () => 0);
  assert.equal(triggered[0].storeId, 'store-xyz');
});

test('rollStoreEvents: revenueMultiplierRangeが無ければ倍率1', () => {
  const definitions: StoreEventDefinition[] = [{ id: 'rumor', probability: 1, satisfactionRange: [-10, -10] }];
  const triggered = rollStoreEvents(definitions, makeStore(), 100, () => 0);
  assert.equal(triggered[0].revenueMultiplier, 1);
  assert.equal(triggered[0].satisfactionDelta, -10);
});
