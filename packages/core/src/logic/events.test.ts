import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SimEvent, SimState } from '../types/simState.js';
import { rollEvents, applyEffect } from './events.js';

function makeState(overrides: Partial<SimState> = {}): SimState {
  return {
    turn: 0,
    turnUnit: 'month',
    statuses: {
      brandAwareness: { key: 'brandAwareness', value: 50, min: 0, max: 100 },
    },
    cash: 10000,
    ...overrides,
  };
}

test('rollEvents: rng()がprobability未満のイベントのみ発生する', () => {
  const events: SimEvent[] = [
    { id: 'always', probability: 1, effect: { cash: 100 } },
    { id: 'never', probability: 0, effect: { cash: -100 } },
  ];
  const triggered = rollEvents(events, makeState(), () => 0.5);
  assert.deepEqual(
    triggered.map((e) => e.id),
    ['always']
  );
});

test('rollEvents: conditionを満たさないイベントは除外される', () => {
  const events: SimEvent[] = [
    { id: 'lowCash', probability: 1, condition: (state) => state.cash < 5000, effect: {} },
  ];
  const triggered = rollEvents(events, makeState({ cash: 10000 }), () => 0);
  assert.equal(triggered.length, 0);
});

test('applyEffect: cashキーはstate.cashに加算される', () => {
  const next = applyEffect(makeState(), { cash: 500 });
  assert.equal(next.cash, 10500);
});

test('applyEffect: statusesはmin/maxでクランプされる', () => {
  const next = applyEffect(makeState(), { brandAwareness: 100 });
  assert.equal(next.statuses.brandAwareness.value, 100); // 50+100=150 -> clamp to max 100
});

test('applyEffect: 未定義のstatusキーは無視される', () => {
  const next = applyEffect(makeState(), { unknownStatus: 10 });
  assert.equal(next.statuses.unknownStatus, undefined);
});
