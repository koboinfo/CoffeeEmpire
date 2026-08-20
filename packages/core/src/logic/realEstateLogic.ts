import type { RealEstateInvestment } from '../types/corporate.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 不動産(建物)の法定耐用年数は本来は構造(鉄骨造34年・木造22年等)によって細かく分かれるが、
 * このアプリでは簡略化して一律240ヶ月(20年)の定額法とする。
 * calculateEquipmentDepreciation(financials.ts)と同じ計算パターン。
 */
export const REAL_ESTATE_DEPRECIATION_MONTHS = 240;

export interface RealEstateDepreciationResult {
  monthlyDepreciation: number;
  netBookValue: number;
}

export function calculateRealEstateDepreciation(
  investment: RealEstateInvestment,
  currentTurn: number
): RealEstateDepreciationResult {
  const age = currentTurn - investment.purchasedAtTurn;
  const monthlyDepreciation = investment.purchasePrice / REAL_ESTATE_DEPRECIATION_MONTHS;

  if (age >= REAL_ESTATE_DEPRECIATION_MONTHS) {
    return { monthlyDepreciation: 0, netBookValue: 0 };
  }

  const accumulated = monthlyDepreciation * Math.max(0, age);
  return { monthlyDepreciation, netBookValue: Math.max(0, investment.purchasePrice - accumulated) };
}

/**
 * 月次維持費(修繕積立・管理費相当)。utilitiesCost(turnEngine.ts)と同じ
 * 「購入額に連動する額を実勢レンジにクランプする」パターン。年0.6%相当を月割りした額を
 * 月次¥8,000〜¥120,000の範囲にクランプする。
 */
export function calculateRealEstateMaintenanceCost(investment: RealEstateInvestment): number {
  const raw = (investment.purchasePrice * 0.006) / 12;
  return Math.round(clamp(raw, 8_000, 120_000));
}

const VACANCY_PROBABILITY = 0.1; // 毎ターン10%の確率で空室が発生する
const VACANCY_INCOME_FACTOR = 0.2; // 空室月は賃料収入が20%まで落ち込む(原状回復・客付け中等)

export interface VacancyRoll {
  isVacant: boolean;
  incomeFactor: number; // 満室時1、空室時VACANCY_INCOME_FACTOR
}

/**
 * 空室判定(確率的)。rngはturnEngineの他のランダム処理と同じく引数で受け取る
 * (テストで決定的に検証するため、裸のMath.random()は呼ばない)。
 */
export function rollVacancy(rng: () => number = Math.random): VacancyRoll {
  const isVacant = rng() < VACANCY_PROBABILITY;
  return { isVacant, incomeFactor: isVacant ? VACANCY_INCOME_FACTOR : 1 };
}

export interface RealEstateMonthlyResult {
  effectiveRentalIncome: number;
  maintenanceCost: number;
  monthlyDepreciation: number;
  netBookValue: number;
  isVacant: boolean;
}

/**
 * 保有不動産1件分の当月の賃貸収入(空室リスク考慮後)・維持費・減価償却・簿価をまとめて算出する。
 * turnEngine側はこれをownedRealEstate各件についてループし、PL明細(収入+費用)と
 * propertyAndEquipmentNet(BSの資産簿価)へ積み上げる。
 */
export function calculateRealEstateMonthlyResult(
  investment: RealEstateInvestment,
  currentTurn: number,
  rng: () => number = Math.random
): RealEstateMonthlyResult {
  const { monthlyDepreciation, netBookValue } = calculateRealEstateDepreciation(investment, currentTurn);
  const maintenanceCost = calculateRealEstateMaintenanceCost(investment);
  const vacancy = rollVacancy(rng);
  const effectiveRentalIncome = Math.round(investment.monthlyRentalIncome * vacancy.incomeFactor);

  return { effectiveRentalIncome, maintenanceCost, monthlyDepreciation, netBookValue, isVacant: vacancy.isVacant };
}
