import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Farm } from '../types/supplyChain.js';
import {
  calculateGreenBeanPurchase,
  calculateRoastOutput,
  calculateFarmAcquisitionPrice,
  calculateOwnedFarmHarvest,
  calculateMenuItemPreferenceScore,
} from './supplyChain.js';

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: 'farm-1',
    country: 'brazil',
    qGrade: 78,
    pricePerKg: 6.5,
    availableKgPerMonth: 5000,
    reliability: 80,
    ...overrides,
  };
}

test('calculateGreenBeanPurchase: requestedKgがavailableKgPerMonth以下ならそのまま届く(供給不足なしの場合)', () => {
  const farm = makeFarm({ availableKgPerMonth: 5000, reliability: 100 });
  const result = calculateGreenBeanPurchase(farm, 100, () => 0.5); // rng(0.5) <= reliability/100(1.0) なので不足なし
  assert.equal(result.deliveredKg, 100);
  assert.equal(result.cost, 650);
});

test('calculateGreenBeanPurchase: requestedKgがavailableKgPerMonthを超えたら頭打ちになる', () => {
  const farm = makeFarm({ availableKgPerMonth: 500, reliability: 100 });
  const result = calculateGreenBeanPurchase(farm, 1000, () => 0.5);
  assert.equal(result.deliveredKg, 500);
});

test('calculateGreenBeanPurchase: rngがreliabilityを上回ると供給不足(70%)になる', () => {
  const farm = makeFarm({ availableKgPerMonth: 1000, reliability: 50 });
  const result = calculateGreenBeanPurchase(farm, 1000, () => 0.9); // 0.9 > 0.5 → 供給不足
  assert.equal(result.deliveredKg, 700); // 1000 * 0.7
});

test('calculateRoastOutput: 単一ロットで歩留まりと品質スコアを計算する', () => {
  const result = calculateRoastOutput([{ qGrade: 80, kg: 100, pricePerKg: 6 }], 'medium');
  assert.equal(result.outputKg, 84); // 100 * 0.84
  assert.equal(result.qualityScore, 78); // round(80 * 0.98)
});

test('calculateRoastOutput: 複数ロットはkg加重平均のQグレードを使う', () => {
  const result = calculateRoastOutput(
    [
      { qGrade: 80, kg: 100, pricePerKg: 6 },
      { qGrade: 90, kg: 100, pricePerKg: 12 },
    ],
    'light'
  );
  assert.equal(result.qualityScore, 85); // (80*100+90*100)/200 = 85, *1.0
});

test('calculateRoastOutput: 深煎りほどoutputKgとqualityScoreが下がる', () => {
  const light = calculateRoastOutput([{ qGrade: 80, kg: 100, pricePerKg: 6 }], 'light');
  const dark = calculateRoastOutput([{ qGrade: 80, kg: 100, pricePerKg: 6 }], 'dark');
  assert.ok(dark.outputKg < light.outputKg);
  assert.ok(dark.qualityScore < light.qualityScore);
});

test('calculateRoastOutput: ロットが空ならoutputKg・qualityScore・costPerKgともに0', () => {
  const result = calculateRoastOutput([], 'medium');
  assert.equal(result.outputKg, 0);
  assert.equal(result.qualityScore, 0);
  assert.equal(result.costPerKg, 0);
});

test('calculateRoastOutput: costPerKgは投入コスト合計÷歩留まり後kg(焙煎ロス分だけ単価が上がる)', () => {
  const result = calculateRoastOutput([{ qGrade: 80, kg: 100, pricePerKg: 6 }], 'medium');
  // 投入コスト=600, outputKg=84 → 600/84 ≈ 7.14
  assert.equal(result.costPerKg, Math.round((600 / 84) * 100) / 100);
  assert.ok(result.costPerKg > 6); // 歩留まりロスにより生豆単価より高くなる
});

test('calculateFarmAcquisitionPrice: 月産量×市場単価×24ヶ月分', () => {
  const farm = makeFarm({ availableKgPerMonth: 1000, pricePerKg: 5 });
  assert.equal(calculateFarmAcquisitionPrice(farm), 1000 * 5 * 24);
});

test('calculateOwnedFarmHarvest: 不作でなければavailableKgPerMonthをフル収穫する', () => {
  const farm = makeFarm({ availableKgPerMonth: 1000, pricePerKg: 5 });
  const result = calculateOwnedFarmHarvest(farm, () => 0.9); // 0.9 > 0.12 → 不作でない
  assert.equal(result.isHarvestFailure, false);
  assert.equal(result.deliveredKg, 1000);
  assert.equal(result.maintenanceCost, Math.round(1000 * 5 * 0.1));
});

test('calculateOwnedFarmHarvest: 不作時は収穫量が激減する', () => {
  const farm = makeFarm({ availableKgPerMonth: 1000, pricePerKg: 5 });
  const result = calculateOwnedFarmHarvest(farm, () => 0.05); // 0.05 < 0.12 → 不作
  assert.equal(result.isHarvestFailure, true);
  assert.equal(result.deliveredKg, 200); // 1000 * 0.2
});

test('calculateOwnedFarmHarvest: 維持費は市場単価より大幅に低い(市場購入コストと比較)', () => {
  const farm = makeFarm({ availableKgPerMonth: 1000, pricePerKg: 5 });
  const ownedResult = calculateOwnedFarmHarvest(farm, () => 0.9);
  const marketCost = 1000 * 5; // 市場でそのまま買った場合の単純比較
  assert.ok(ownedResult.maintenanceCost < marketCost * 0.5);
});

test('calculateMenuItemPreferenceScore: シングルオリジンは産地ストーリー性で+4される', () => {
  const score = calculateMenuItemPreferenceScore({
    baseQualityScore: 80,
    originCountries: ['brazil'],
    isBlend: false,
  });
  assert.equal(score, 84);
});

test('calculateMenuItemPreferenceScore: オリジナルブレンドは目新しさで+6される', () => {
  const score = calculateMenuItemPreferenceScore({
    baseQualityScore: 80,
    originCountries: ['brazil', 'ethiopia'],
    isBlend: true,
  });
  assert.equal(score, 86);
});

test('calculateMenuItemPreferenceScore: 100を超えない', () => {
  const score = calculateMenuItemPreferenceScore({
    baseQualityScore: 98,
    originCountries: ['brazil', 'ethiopia'],
    isBlend: true,
  });
  assert.equal(score, 100);
});
