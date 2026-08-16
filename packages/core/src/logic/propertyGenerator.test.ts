import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { City } from '../types/store.js';
import { generatePropertiesForCity } from './propertyGenerator.js';

function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: 'city-1',
    name: 'Metropolis',
    country: 'USA',
    population: 1_000_000,
    incomeLevel: 5,
    footTrafficIndex: 1,
    ...overrides,
  };
}

test('generatePropertiesForCity: kiosk/small/mediumの3件を返す', () => {
  const properties = generatePropertiesForCity(makeCity(), () => 0.5);
  assert.deepEqual(
    properties.map((p) => p.size),
    ['kiosk', 'small', 'medium']
  );
});

test('generatePropertiesForCity: 全てcityIdが一致しownership=unowned', () => {
  const city = makeCity();
  const properties = generatePropertiesForCity(city, () => 0.5);
  for (const property of properties) {
    assert.equal(property.cityId, city.id);
    assert.equal(property.ownership, 'unowned');
  }
});

test('generatePropertiesForCity: 規模が大きいほどfootTrafficとrentPerMonthも大きい', () => {
  const properties = generatePropertiesForCity(makeCity(), () => 0.5);
  const [kiosk, small, medium] = properties;
  assert.ok(kiosk.footTraffic < small.footTraffic);
  assert.ok(small.footTraffic < medium.footTraffic);
  assert.ok(kiosk.rentPerMonth < small.rentPerMonth);
  assert.ok(small.rentPerMonth < medium.rentPerMonth);
});

test('generatePropertiesForCity: rngは±10%の範囲でのみ変動させる', () => {
  const city = makeCity();
  const low = generatePropertiesForCity(city, () => 0)[2]; // medium, variance=0.9
  const high = generatePropertiesForCity(city, () => 1)[2]; // medium, variance=1.1
  assert.ok(high.footTraffic > low.footTraffic);
  assert.ok(high.footTraffic / low.footTraffic < 1.25); // 1.1/0.9 ≈ 1.22
});
