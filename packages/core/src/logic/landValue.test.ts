import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCommercialDensity, updateLandValueAnnual } from './landValue.js';

function fixedRng(value: number): () => number {
  return () => value;
}

test('updateLandValueAnnual: 都市基礎成長率のみでも地価が上昇する', () => {
  const result = updateLandValueAnnual(
    { landValue: 100_000_000 },
    { cityBaseGrowthRate: 0.02, footTrafficGrowthRate: 0, commercialDensity: 0, rng: fixedRng(0.5) }
  );
  assert.ok(result.landValue > 100_000_000);
});

test('updateLandValueAnnual: 商業密度が高いほど地価上昇が大きくなる(自己強化ループ)', () => {
  const low = updateLandValueAnnual(
    { landValue: 100_000_000 },
    { cityBaseGrowthRate: 0.01, footTrafficGrowthRate: 0, commercialDensity: 0, rng: fixedRng(0.5) }
  );
  const high = updateLandValueAnnual(
    { landValue: 100_000_000 },
    { cityBaseGrowthRate: 0.01, footTrafficGrowthRate: 0, commercialDensity: 1, rng: fixedRng(0.5) }
  );
  assert.ok(high.landValue > low.landValue);
});

test('updateLandValueAnnual: 人流成長率がマイナスだと地価上昇が抑えられる', () => {
  const positive = updateLandValueAnnual(
    { landValue: 100_000_000 },
    { cityBaseGrowthRate: 0.02, footTrafficGrowthRate: 0.2, commercialDensity: 0, rng: fixedRng(0.5) }
  );
  const negative = updateLandValueAnnual(
    { landValue: 100_000_000 },
    { cityBaseGrowthRate: 0.02, footTrafficGrowthRate: -0.2, commercialDensity: 0, rng: fixedRng(0.5) }
  );
  assert.ok(positive.landValue > negative.landValue);
});

test('updateLandValueAnnual: 極端な下落要因があっても年-15%を下回らない(クランプ)', () => {
  const result = updateLandValueAnnual(
    { landValue: 100_000_000 },
    { cityBaseGrowthRate: -1, footTrafficGrowthRate: -1, commercialDensity: 0, rng: fixedRng(0.999) }
  );
  assert.ok(result.landValue >= 100_000_000 * 0.85 - 1);
});

test('updateLandValueAnnual: 地価は0未満にならない', () => {
  const result = updateLandValueAnnual(
    { landValue: 1000 },
    { cityBaseGrowthRate: -1, footTrafficGrowthRate: -1, commercialDensity: 0, rng: fixedRng(0.999) }
  );
  assert.ok(result.landValue >= 0);
});

test('calculateCommercialDensity: 店舗数0なら密度0、飽和店舗数以上なら密度1にクランプされる', () => {
  assert.equal(calculateCommercialDensity(0), 0);
  assert.equal(calculateCommercialDensity(8), 1);
  assert.equal(calculateCommercialDensity(20), 1);
  assert.ok(calculateCommercialDensity(4) > 0 && calculateCommercialDensity(4) < 1);
});
