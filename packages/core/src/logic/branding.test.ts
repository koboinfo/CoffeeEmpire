import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CITY_BRAND_AWARENESS_BASELINE,
  getCityBrandAwareness,
  decayBrandAwarenessByCity,
  bumpCityBrandAwareness,
  calculateCityAwarenessRevenueFactor,
} from './branding.js';

test('getCityBrandAwareness: 未設定のcityIdはbaselineを返す', () => {
  assert.equal(getCityBrandAwareness(undefined, 'city-tokyo'), CITY_BRAND_AWARENESS_BASELINE);
  assert.equal(getCityBrandAwareness({}, 'city-tokyo'), CITY_BRAND_AWARENESS_BASELINE);
});

test('decayBrandAwarenessByCity: baselineより高い値はbaselineへ向けて減衰する', () => {
  const next = decayBrandAwarenessByCity({ 'city-tokyo': 80 });
  assert.ok(next['city-tokyo'] < 80);
  assert.ok(next['city-tokyo'] > CITY_BRAND_AWARENESS_BASELINE);
});

test('decayBrandAwarenessByCity: baselineより低い値はbaselineへ向けて回復する', () => {
  const next = decayBrandAwarenessByCity({ 'city-tokyo': 5 });
  assert.ok(next['city-tokyo'] > 5);
  assert.ok(next['city-tokyo'] < CITY_BRAND_AWARENESS_BASELINE);
});

test('bumpCityBrandAwareness: 指定都市のみ加点され0-100にクランプされる', () => {
  const next = bumpCityBrandAwareness({ 'city-tokyo': 95 }, 'city-tokyo', 20);
  assert.equal(next['city-tokyo'], 100);
});

test('bumpCityBrandAwareness: 未設定都市はbaselineから加点される', () => {
  const next = bumpCityBrandAwareness(undefined, 'city-osaka', 10);
  assert.equal(next['city-osaka'], CITY_BRAND_AWARENESS_BASELINE + 10);
});

test('calculateCityAwarenessRevenueFactor: 0で最小係数0.9、100で最大係数1.1', () => {
  assert.equal(calculateCityAwarenessRevenueFactor(0), 0.9);
  assert.equal(calculateCityAwarenessRevenueFactor(100), 1.1);
});
