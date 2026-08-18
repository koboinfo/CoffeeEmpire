import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCreditRating } from './creditRating.js';

test('calculateCreditRating: 無借金・高収益・潤沢な現金ならAAA相当の高スコア', () => {
  const result = calculateCreditRating({
    cash: 10_000_000,
    totalAssets: 10_000_000,
    totalLiabilities: 0,
    trailingNetIncome: 1_000_000,
    monthlyRevenue: 2_000_000,
    isBankrupt: false,
  });
  assert.equal(result.rating, 'AAA');
  assert.ok(result.interestRateMultiplier < 1);
});

test('calculateCreditRating: 高負債・赤字・現金枯渇なら低格付け', () => {
  const result = calculateCreditRating({
    cash: 10_000,
    totalAssets: 1_000_000,
    totalLiabilities: 950_000,
    trailingNetIncome: -500_000,
    monthlyRevenue: 500_000,
    isBankrupt: false,
  });
  assert.ok(['B', 'CCC', 'D'].includes(result.rating));
  assert.ok(result.interestRateMultiplier > 1);
});

test('calculateCreditRating: isBankrupt=trueなら財務指標に関わらずDになる', () => {
  const result = calculateCreditRating({
    cash: 10_000_000,
    totalAssets: 10_000_000,
    totalLiabilities: 0,
    trailingNetIncome: 1_000_000,
    monthlyRevenue: 2_000_000,
    isBankrupt: true,
  });
  assert.equal(result.rating, 'D');
});
