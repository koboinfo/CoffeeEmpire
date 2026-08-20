import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { City, Property } from '../types/store.js';
import type { FranchiseContract } from '../types/franchise.js';
import {
  calculateFranchiseRoyaltyIncome,
  calculateTotalFranchiseRoyaltyIncome,
  evaluateFranchiseOpportunity,
} from './franchiseLogic.js';

function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: 'city-1',
    name: 'Test City',
    country: 'JP',
    population: 1_000_000,
    incomeLevel: 5,
    footTrafficIndex: 1,
    ...overrides,
  };
}

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'prop-1',
    cityId: 'city-1',
    size: 'medium',
    footTraffic: 1000,
    rentPerMonth: 300_000,
    ownership: 'unowned',
    ...overrides,
  };
}

test('evaluateFranchiseOpportunity: 客足・所得水準が高いほど月間総売上見積もりが大きくなる', () => {
  const rng = () => 0.5; // variance固定
  const low = evaluateFranchiseOpportunity(makeProperty({ footTraffic: 500 }), makeCity({ incomeLevel: 2 }), rng);
  const high = evaluateFranchiseOpportunity(makeProperty({ footTraffic: 2000 }), makeCity({ incomeLevel: 9 }), rng);
  assert.ok(high.monthlyGrossRevenueEstimate > low.monthlyGrossRevenueEstimate);
  assert.ok(low.royaltyRate > 0 && low.royaltyRate < 1);
});

test('calculateFranchiseRoyaltyIncome: monthlyGrossRevenueEstimate×royaltyRateになる', () => {
  const contract: FranchiseContract = {
    id: 'fc-1',
    cityId: 'city-1',
    royaltyRate: 0.06,
    monthlyGrossRevenueEstimate: 1_000_000,
    openedAtTurn: 0,
  };
  assert.equal(calculateFranchiseRoyaltyIncome(contract), 60_000);
});

test('calculateFranchiseRoyaltyIncome: royaltyRateが範囲外でも0-1にクランプされる', () => {
  const contract: FranchiseContract = {
    id: 'fc-2',
    cityId: 'city-1',
    royaltyRate: 1.5,
    monthlyGrossRevenueEstimate: 100,
    openedAtTurn: 0,
  };
  assert.equal(calculateFranchiseRoyaltyIncome(contract), 100);
});

test('calculateTotalFranchiseRoyaltyIncome: 複数契約分を合算する', () => {
  const contracts: FranchiseContract[] = [
    { id: 'fc-1', cityId: 'city-1', royaltyRate: 0.06, monthlyGrossRevenueEstimate: 1_000_000, openedAtTurn: 0 },
    { id: 'fc-2', cityId: 'city-2', royaltyRate: 0.05, monthlyGrossRevenueEstimate: 500_000, openedAtTurn: 0 },
  ];
  assert.equal(calculateTotalFranchiseRoyaltyIncome(contracts), 60_000 + 25_000);
});
