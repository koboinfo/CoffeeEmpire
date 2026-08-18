import type { Loan } from '../types/corporate.js';
import type { CreditRatingResult } from './creditRating.js';

/**
 * 信用格付けを反映した融資オファー金利。基準金利(プリセットの表示金利)に
 * 格付けごとのinterestRateMultiplierを乗算する。下限0.5%(実質ゼロ金利未満は非現実的なため)でクランプする。
 */
export function calculateLoanOfferRate(baseAnnualInterestRate: number, creditRating: CreditRatingResult): number {
  return Math.max(0.005, Math.round(baseAnnualInterestRate * creditRating.interestRateMultiplier * 1000) / 1000);
}

/**
 * 元利均等返済(アニュイティ方式)の毎ターン返済額を算出する。
 * annualInterestRateが0の場合は単純に元本をtermTurnsで均等分割する。
 */
export function calculateLoanMonthlyPayment(principal: number, annualInterestRate: number, termTurns: number): number {
  const monthlyRate = annualInterestRate / 12;
  if (monthlyRate === 0) return Math.round(principal / termTurns);
  const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termTurns));
  return Math.round(payment);
}

export function createLoan(
  id: string,
  principal: number,
  annualInterestRate: number,
  termTurns: number,
  originatedAtTurn: number
): Loan {
  return {
    id,
    principal,
    remainingPrincipal: principal,
    annualInterestRate,
    originatedAtTurn,
    termTurns,
    monthlyPayment: calculateLoanMonthlyPayment(principal, annualInterestRate, termTurns),
  };
}

export interface LoanServicingResult {
  updatedLoans: Loan[];
  totalInterestExpense: number;
  totalPrincipalRepayment: number;
}

/**
 * 全融資の毎ターン返済処理。利息分はP&Lのinterest expenseへ、元本返済分は
 * キャッシュフロー(financing)・貸借対照表(longTermDebt減少)へ反映する想定で、
 * この関数自体は集計値のみを返す(状態更新はturnEngine側で行う)。
 * 完済した融資はupdatedLoansから除外される。
 */
export function serviceLoans(loans: Loan[]): LoanServicingResult {
  let totalInterestExpense = 0;
  let totalPrincipalRepayment = 0;
  const updatedLoans: Loan[] = [];

  for (const loan of loans) {
    if (loan.remainingPrincipal <= 0) continue;
    const monthlyRate = loan.annualInterestRate / 12;
    const interest = loan.remainingPrincipal * monthlyRate;
    const principalPortion = Math.min(loan.remainingPrincipal, Math.max(0, loan.monthlyPayment - interest));
    const remainingPrincipal = Math.round((loan.remainingPrincipal - principalPortion) * 100) / 100;

    totalInterestExpense += interest;
    totalPrincipalRepayment += principalPortion;

    if (remainingPrincipal > 0.01) {
      updatedLoans.push({ ...loan, remainingPrincipal });
    }
  }

  return {
    updatedLoans,
    totalInterestExpense: Math.round(totalInterestExpense),
    totalPrincipalRepayment: Math.round(totalPrincipalRepayment),
  };
}
