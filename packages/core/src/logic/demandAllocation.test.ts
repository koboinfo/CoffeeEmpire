import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateCityDemand,
  ambianceFactor,
  brandFactor,
  calculateAttractionScore,
  priceFactorElastic,
  qualityFactorSaturating,
  trafficWeight,
} from './demandAllocation.js';

test('trafficWeight: 8,000未満は非線形に急減衰し、8,000以上は線形に増加する', () => {
  assert.ok(trafficWeight(6000) < trafficWeight(8000));
  assert.equal(trafficWeight(8000), 1.0);
  assert.equal(trafficWeight(12000), 1.5);
  assert.ok(trafficWeight(6000) < 0.6); // レポート記載値0.49に近い急減衰
});

test('priceFactorElastic: 参照価格通りなら1.0、割高だと1.0未満になる', () => {
  assert.equal(priceFactorElastic(100, 100), 1.0);
  assert.ok(priceFactorElastic(120, 100) < 1.0);
  assert.ok(priceFactorElastic(80, 100) > 1.0);
});

test('priceFactorElastic: referencePriceが0以下なら1を返す(0除算を避ける)', () => {
  assert.equal(priceFactorElastic(100, 0), 1);
});

test('qualityFactorSaturating: 品質が上がるほど係数は増えるが、逓減して1.45で頭打ちに近づく', () => {
  const low = qualityFactorSaturating(30);
  const mid = qualityFactorSaturating(60);
  const high = qualityFactorSaturating(100);
  assert.ok(low < mid && mid < high);
  assert.ok(high <= 1.45 + 1e-9);
});

test('brandFactor: 認知度・ロイヤルティが高いほど係数が上がり、両方0なら1.0', () => {
  assert.equal(brandFactor(0, 0), 1.0);
  assert.ok(brandFactor(1, 1) > brandFactor(0.5, 0.5));
});

test('ambianceFactor: maxTierが0なら1を返し(0除算回避)、tierが高いほど係数が上がる', () => {
  assert.equal(ambianceFactor(0, 0), 1);
  assert.ok(ambianceFactor(5, 5) > ambianceFactor(1, 5));
});

test('calculateAttractionScore: 各係数の積になる', () => {
  const factors = {
    footTraffic: 10000,
    price: 500,
    referencePrice: 500,
    quality: 60,
    awareness: 0.5,
    loyalty: 0.5,
    interiorTier: 2,
    maxInteriorTier: 5,
  };
  const expected =
    trafficWeight(factors.footTraffic) *
    priceFactorElastic(factors.price, factors.referencePrice) *
    qualityFactorSaturating(factors.quality) *
    brandFactor(factors.awareness, factors.loyalty) *
    ambianceFactor(factors.interiorTier, factors.maxInteriorTier);
  assert.ok(Math.abs(calculateAttractionScore(factors) - expected) < 1e-9);
});

test('allocateCityDemand: 引力スコアの比率で需要プールを按分する', () => {
  const result = allocateCityDemand(1000, [
    { storeId: 'a', attraction: 3 },
    { storeId: 'b', attraction: 1 },
  ]);
  assert.equal(result.find((r) => r.storeId === 'a')?.customers, 750);
  assert.equal(result.find((r) => r.storeId === 'b')?.customers, 250);
});

test('allocateCityDemand: 競合が増える(店舗が増える)と既存店の取り分が減る', () => {
  const before = allocateCityDemand(1000, [{ storeId: 'a', attraction: 1 }]);
  const after = allocateCityDemand(1000, [
    { storeId: 'a', attraction: 1 },
    { storeId: 'competitor', attraction: 1 },
  ]);
  const aBefore = before.find((r) => r.storeId === 'a')!.customers;
  const aAfter = after.find((r) => r.storeId === 'a')!.customers;
  assert.ok(aAfter < aBefore);
});

test('allocateCityDemand: 総引力スコアが0または需要プールが0なら全店customers=0', () => {
  const result = allocateCityDemand(1000, [{ storeId: 'a', attraction: 0 }]);
  assert.equal(result[0].customers, 0);
  const zeroPool = allocateCityDemand(0, [{ storeId: 'a', attraction: 1 }]);
  assert.equal(zeroPool[0].customers, 0);
});
