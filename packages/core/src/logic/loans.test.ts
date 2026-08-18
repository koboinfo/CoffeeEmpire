import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Loan } from '../types/corporate.js';
import { calculateLoanMonthlyPayment, createLoan, serviceLoans, calculateLoanOfferRate } from './loans.js';
import type { CreditRatingResult } from './creditRating.js';

test('calculateLoanMonthlyPayment: 金利0%なら元本を期間で均等分割する', () => {
  assert.equal(calculateLoanMonthlyPayment(120_000, 0, 12), 10_000);
});

test('calculateLoanMonthlyPayment: 金利ありだと元利均等返済額は単純分割より大きい', () => {
  const withInterest = calculateLoanMonthlyPayment(120_000, 0.12, 12);
  const withoutInterest = calculateLoanMonthlyPayment(120_000, 0, 12);
  assert.ok(withInterest > withoutInterest);
});

test('createLoan: remainingPrincipalが元本と一致し、monthlyPaymentが算出される', () => {
  const loan = createLoan('loan-1', 100_000, 0.08, 24, 5);
  assert.equal(loan.remainingPrincipal, 100_000);
  assert.equal(loan.originatedAtTurn, 5);
  assert.ok(loan.monthlyPayment > 0);
});

test('serviceLoans: 毎ターンremainingPrincipalが減少する', () => {
  const loan = createLoan('loan-1', 12_000, 0, 12, 0);
  const { updatedLoans, totalPrincipalRepayment, totalInterestExpense } = serviceLoans([loan]);
  assert.equal(totalInterestExpense, 0);
  assert.equal(totalPrincipalRepayment, 1_000);
  assert.equal(updatedLoans[0].remainingPrincipal, 11_000);
});

test('serviceLoans: 完済した融資はupdatedLoansから除外される', () => {
  const almostPaidOff: Loan = {
    id: 'loan-1',
    principal: 12_000,
    remainingPrincipal: 500,
    annualInterestRate: 0,
    originatedAtTurn: 0,
    termTurns: 12,
    monthlyPayment: 1_000,
  };
  const { updatedLoans } = serviceLoans([almostPaidOff]);
  assert.equal(updatedLoans.length, 0);
});

test('serviceLoans: 金利がある場合、利息はremainingPrincipal×月利で計算される', () => {
  const loan = createLoan('loan-1', 100_000, 0.12, 24, 0);
  const { totalInterestExpense } = serviceLoans([loan]);
  assert.equal(totalInterestExpense, Math.round(100_000 * 0.01));
});

function makeRating(interestRateMultiplier: number): CreditRatingResult {
  return { rating: 'BBB', score: 60, interestRateMultiplier };
}

test('calculateLoanOfferRate: 格付けのinterestRateMultiplierを基準金利に乗算する', () => {
  assert.equal(calculateLoanOfferRate(0.08, makeRating(0.8)), 0.064);
});

test('calculateLoanOfferRate: 低格付け(高multiplier)ほど金利が高くなる', () => {
  const goodRate = calculateLoanOfferRate(0.08, makeRating(0.7));
  const badRate = calculateLoanOfferRate(0.08, makeRating(2.0));
  assert.ok(badRate > goodRate);
});

test('calculateLoanOfferRate: 下限0.5%を下回らない', () => {
  assert.ok(calculateLoanOfferRate(0.001, makeRating(0.5)) >= 0.005);
});
