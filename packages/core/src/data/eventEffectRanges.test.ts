import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEventEffect } from './eventEffectRanges.js';

test('resolveEventEffect: レンジが定義されているキーはレンジ内のランダムな値になる', () => {
  const resolved = resolveEventEffect('economic-boom', { cash: 999 }, () => 0.5);
  // economic-boomのcashレンジは[200_000, 500_000]、rng=0.5なら中央値350,000
  assert.equal(resolved.cash, 350_000);
});

test('resolveEventEffect: rng=0はレンジの最小値、rng=1に近い値は最大値に近づく', () => {
  const min = resolveEventEffect('economic-boom', { cash: 0 }, () => 0);
  assert.equal(min.cash, 200_000);
});

test('resolveEventEffect: レンジが未定義のイベントidはbaseEffectをそのまま返す', () => {
  const resolved = resolveEventEffect('unknown-event', { cash: 123, brandAwareness: 5 }, () => 0.5);
  assert.deepEqual(resolved, { cash: 123, brandAwareness: 5 });
});

test('resolveEventEffect: レンジ未定義のキーはbaseEffectの値を保持する', () => {
  // loyalty-program-successはcash/brandAwarenessの両方にレンジがあるが、他のキーがあれば保持されることを確認
  const resolved = resolveEventEffect('loyalty-program-success', { cash: 0, brandAwareness: 0, other: 42 }, () => 0);
  assert.equal(resolved.other, 42);
});
