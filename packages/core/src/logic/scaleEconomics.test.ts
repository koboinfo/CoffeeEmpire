import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompetitorRubberBandGrowthRate, calculateMarketSaturationFactor } from './scaleEconomics.js';

test('calculateMarketSaturationFactor: 同一都市の自社店舗数が増えるほど1店舗あたりの係数が下がる', () => {
  const one = calculateMarketSaturationFactor(1);
  const six = calculateMarketSaturationFactor(6);
  const twelve = calculateMarketSaturationFactor(12);
  assert.equal(one, 1);
  assert.ok(six < one);
  assert.ok(twelve < six);
  assert.ok(six >= 0.15 && six <= 1);
});

test('calculateMarketSaturationFactor: 下限0.15を下回らない(極端な店舗数でもゼロにはならない)', () => {
  assert.ok(calculateMarketSaturationFactor(10000) >= 0.15);
});

test('calculateCompetitorRubberBandGrowthRate: プレイヤーの成長率の0.4〜0.6倍にクランプされる', () => {
  const result = calculateCompetitorRubberBandGrowthRate(0.1, 0.9); // 0.9は0.4-0.6にクランプされる
  assert.ok(Math.abs(result - 0.1 * 0.6) < 1e-9);
});

test('calculateCompetitorRubberBandGrowthRate: プレイヤーが成長していなければ競合への影響は0', () => {
  assert.equal(calculateCompetitorRubberBandGrowthRate(0), 0);
  assert.equal(calculateCompetitorRubberBandGrowthRate(-0.05), 0);
});
