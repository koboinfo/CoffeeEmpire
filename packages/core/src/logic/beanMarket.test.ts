import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBeanPriceFactor, calculateEffectiveBeanPrice } from './beanMarket.js';

test('calculateBeanPriceFactor: 同じfarmId・turnなら常に同じ値を返す(決定論的)', () => {
  const a = calculateBeanPriceFactor('farm-ethiopia-yirgacheffe', 5);
  const b = calculateBeanPriceFactor('farm-ethiopia-yirgacheffe', 5);
  assert.equal(a, b);
});

test('calculateBeanPriceFactor: 農園が違えば同じturnでも位相がずれて値が異なる', () => {
  const a = calculateBeanPriceFactor('farm-ethiopia-yirgacheffe', 5);
  const b = calculateBeanPriceFactor('farm-brazil-cerrado', 5);
  assert.notEqual(a, b);
});

test('calculateBeanPriceFactor: 極端に外れない範囲(0.7〜1.3程度)に収まる', () => {
  for (let turn = 1; turn <= 60; turn++) {
    const factor = calculateBeanPriceFactor('farm-kenya-nyeri', turn);
    assert.ok(factor > 0.7 && factor < 1.3, `turn=${turn} factor=${factor}`);
  }
});

test('calculateEffectiveBeanPrice: pricePerKgにfactorを乗じて四捨五入する', () => {
  const farm = { id: 'farm-1', pricePerKg: 2000 };
  const price = calculateEffectiveBeanPrice(farm, 3);
  const expected = Math.round(2000 * calculateBeanPriceFactor('farm-1', 3));
  assert.equal(price, expected);
});
