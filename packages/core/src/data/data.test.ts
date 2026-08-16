import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cities } from './cities.js';
import { farms } from './farms.js';
import { events } from './events.js';

function assertUniqueIds(items: { id: string }[], label: string) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label}にID重複がある`);
}

test('cities: IDが重複しない', () => {
  assertUniqueIds(cities, 'cities');
});

test('cities: incomeLevelは1-10の範囲内', () => {
  for (const city of cities) {
    assert.ok(city.incomeLevel >= 1 && city.incomeLevel <= 10, `${city.id}のincomeLevelが範囲外: ${city.incomeLevel}`);
  }
});

test('cities: populationとfootTrafficIndexは正の値', () => {
  for (const city of cities) {
    assert.ok(city.population > 0, `${city.id}のpopulationが0以下`);
    assert.ok(city.footTrafficIndex > 0, `${city.id}のfootTrafficIndexが0以下`);
  }
});

test('farms: IDが重複しない', () => {
  assertUniqueIds(farms, 'farms');
});

test('farms: qGradeは0-100の範囲内', () => {
  for (const farm of farms) {
    assert.ok(farm.qGrade >= 0 && farm.qGrade <= 100, `${farm.id}のqGradeが範囲外: ${farm.qGrade}`);
  }
});

test('farms: reliabilityは0-100の範囲内', () => {
  for (const farm of farms) {
    assert.ok(farm.reliability >= 0 && farm.reliability <= 100, `${farm.id}のreliabilityが範囲外: ${farm.reliability}`);
  }
});

test('farms: pricePerKgとavailableKgPerMonthは正の値', () => {
  for (const farm of farms) {
    assert.ok(farm.pricePerKg > 0, `${farm.id}のpricePerKgが0以下`);
    assert.ok(farm.availableKgPerMonth > 0, `${farm.id}のavailableKgPerMonthが0以下`);
  }
});

test('events: IDが重複しない', () => {
  assertUniqueIds(events, 'events');
});

test('events: probabilityは0-1の範囲内', () => {
  for (const event of events) {
    assert.ok(event.probability >= 0 && event.probability <= 1, `${event.id}のprobabilityが範囲外: ${event.probability}`);
  }
});
