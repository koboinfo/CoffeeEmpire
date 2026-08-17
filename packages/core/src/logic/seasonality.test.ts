import { test } from 'node:test';
import assert from 'node:assert/strict';
import { turnToMonthIndex, calculateSeasonalFactor } from './seasonality.js';

test('turnToMonthIndex: turn1は0(1月)、turn13は再び0(翌年1月)', () => {
  assert.equal(turnToMonthIndex(1), 0);
  assert.equal(turnToMonthIndex(13), 0);
});

test('turnToMonthIndex: turn8は7(8月)', () => {
  assert.equal(turnToMonthIndex(8), 7);
});

test('calculateSeasonalFactor: 8月(turn8)は夏場のピークで係数が1を上回る', () => {
  assert.ok(calculateSeasonalFactor(8) > 1);
});

test('calculateSeasonalFactor: 1月(turn1)は閑散期で係数が1を下回る', () => {
  assert.ok(calculateSeasonalFactor(1) < 1);
});

test('calculateSeasonalFactor: 12ヶ月周期で同じ値を繰り返す', () => {
  assert.equal(calculateSeasonalFactor(1), calculateSeasonalFactor(13));
});
