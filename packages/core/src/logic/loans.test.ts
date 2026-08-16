import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Loan } from '../types/corporate.js';
import { calculateLoanMonthlyPayment, createLoan, serviceLoans } from './loans.js';

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
