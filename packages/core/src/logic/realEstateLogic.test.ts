import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RealEstateInvestment } from '../types/corporate.js';
import {
  REAL_ESTATE_DEPRECIATION_MONTHS,
  calculateRealEstateDepreciation,
  calculateRealEstateMaintenanceCost,
  calculateRealEstateMonthlyResult,
  rollVacancy,
} from './realEstateLogic.js';

function makeInvestment(overrides: Partial<RealEstateInvestment> = {}): RealEstateInvestment {
  return {
    id: 're-1',
    propertyId: 'prop-1',
    purchasePrice: 24_000_000,
    monthlyRentalIncome: 175_000,
    purchasedAtTurn: 0,
    ...overrides,
  };
}

test('calculateRealEstateDepreciation: 定額法で購入直後は月次償却額×0の簿価になる', () => {
  const investment = makeInvestment();
  const { monthlyDepreciation, netBookValue } = calculateRealEstateDepreciation(investment, 0);
  assert.equal(monthlyDepreciation, investment.purchasePrice / REAL_ESTATE_DEPRECIATION_MONTHS);
  assert.equal(netBookValue, investment.purchasePrice);
});

test('calculateRealEstateDepreciation: 耐用年数経過後は償却額・簿価ともに0になる', () => {
  const investment = makeInvestment();
  const { monthlyDepreciation, netBookValue } = calculateRealEstateDepreciation(
    investment,
    REAL_ESTATE_DEPRECIATION_MONTHS
  );
  assert.equal(monthlyDepreciation, 0);
  assert.equal(netBookValue, 0);
});

test('calculateRealEstateDepreciation: 経過月数分だけ簿価が減少する', () => {
  const investment = makeInvestment();
  const elapsed = 12;
  const { monthlyDepreciation, netBookValue } = calculateRealEstateDepreciation(investment, elapsed);
  const expectedNetBookValue = investment.purchasePrice - monthlyDepreciation * elapsed;
  assert.equal(netBookValue, expectedNetBookValue);
});

test('calculateRealEstateMaintenanceCost: 実勢レンジ(8,000〜120,000円)にクランプされる', () => {
  const cheap = calculateRealEstateMaintenanceCost(makeInvestment({ purchasePrice: 1_000 }));
  assert.equal(cheap, 8_000);

  const expensive = calculateRealEstateMaintenanceCost(makeInvestment({ purchasePrice: 1_000_000_000 }));
  assert.equal(expensive, 120_000);
});

test('rollVacancy: rngが低い(確率内)なら空室、incomeFactorが下がる', () => {
  const result = rollVacancy(() => 0);
  assert.equal(result.isVacant, true);
  assert.ok(result.incomeFactor < 1);
});

test('rollVacancy: rngが高い(確率外)なら満室、incomeFactorは1', () => {
  const result = rollVacancy(() => 0.99);
  assert.equal(result.isVacant, false);
  assert.equal(result.incomeFactor, 1);
});

test('calculateRealEstateMonthlyResult: 空室時は実効賃貸収入が満室時より少なくなる', () => {
  const investment = makeInvestment();
  const full = calculateRealEstateMonthlyResult(investment, 6, () => 0.99);
  const vacant = calculateRealEstateMonthlyResult(investment, 6, () => 0);
  assert.equal(full.effectiveRentalIncome, investment.monthlyRentalIncome);
  assert.ok(vacant.effectiveRentalIncome < full.effectiveRentalIncome);
  assert.equal(full.monthlyDepreciation, vacant.monthlyDepreciation);
  assert.equal(full.netBookValue, vacant.netBookValue);
});
